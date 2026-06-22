import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateCertificateFile, type TemplateConfig } from "./certificate-generator";
import { APP_URL } from "@/lib/env";
import {
  ensureCourseBadgeTemplate,
  issueCourseBadge,
  isBadgesEnabled,
} from "./badges-client";
import { hasCompletedRequiredSurvey } from "./survey-service";
import type { Certificate } from "@/types";

/** Thrown when the learner hasn't completed a required survey yet. */
export class SurveyRequiredError extends Error {
  constructor() {
    super("Course survey must be completed before the certificate is issued.");
    this.name = "SurveyRequiredError";
  }
}

interface IssueCertificateParams {
  userId: string;
  courseId: string;
  enrollmentId: string;
}

export async function issueCertificate({
  userId,
  courseId,
  enrollmentId,
}: IssueCertificateParams): Promise<Certificate> {
  // Idempotent: check for existing certificate
  const { data: existing } = await supabaseAdmin
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  if (existing) return existing as Certificate;

  // Survey gate — if the course has an active required survey and the
  // learner hasn't submitted, refuse to issue. Both the API route and
  // the admin manual-issue surface need to handle this rejection.
  const surveyOk = await hasCompletedRequiredSurvey(userId, courseId);
  if (!surveyOk) throw new SurveyRequiredError();

  // Generate certificate number via DB function
  const { data: certNumResult } = await supabaseAdmin.rpc(
    "generate_certificate_number",
    { p_course_id: courseId }
  );
  const certificateNumber =
    certNumResult ?? `VIFM-${Date.now()}`;

  // Get user, course info, and certificate template.
  const [{ data: profile }, { data: course }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("courses")
      .select("title, certificate_template_id, badge_template_external_id")
      .eq("id", courseId)
      .single(),
  ]);

  const userName = profile?.full_name ?? "Learner";
  const courseName = course?.title ?? "Course";

  // Resolve template config
  let templateConfig: TemplateConfig | undefined;

  if (course?.certificate_template_id) {
    const { data: template } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .eq("id", course.certificate_template_id)
      .single();

    if (template) {
      templateConfig = {
        templateKey: template.template_key,
        primaryColor: template.primary_color,
        secondaryColor: template.secondary_color,
        accentColor: template.accent_color,
        logoUrl: template.logo_url,
        organizationName: template.organization_name,
        pptxPath: (template as { pptx_path?: string | null }).pptx_path ?? null,
        placeholderValues:
          ((template as { placeholder_values?: Record<string, string> | null })
            .placeholder_values) ?? null,
      };
    }
  }

  // Fallback to default template
  if (!templateConfig) {
    const { data: defaultTemplate } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .eq("is_default", true)
      .single();

    if (defaultTemplate) {
      templateConfig = {
        templateKey: defaultTemplate.template_key,
        primaryColor: defaultTemplate.primary_color,
        secondaryColor: defaultTemplate.secondary_color,
        accentColor: defaultTemplate.accent_color,
        logoUrl: defaultTemplate.logo_url,
        organizationName: defaultTemplate.organization_name,
        pptxPath:
          (defaultTemplate as { pptx_path?: string | null }).pptx_path ?? null,
        placeholderValues:
          ((defaultTemplate as {
            placeholder_values?: Record<string, string> | null;
          }).placeholder_values) ?? null,
      };
    }
  }

  // Insert certificate row. Two prod-schema quirks handled here:
  //   - `verification_code` is NOT NULL with no DB default → generate one
  //     here so the insert always succeeds. UUID stripped of hyphens
  //     reads cleanly in URLs.
  //   - `template_id` is NOT a column on the certificates table in prod
  //     (despite the type def implying so) — passing it caused every
  //     auto-issue to silently fail with a "column not found" error.
  //     The template choice is still applied via templateConfig above
  //     for the PDF render; we just don't persist the FK.
  const verificationCodeForInsert = randomUUID().replace(/-/g, "").slice(0, 24);
  const { data: cert, error: insertError } = await supabaseAdmin
    .from("certificates")
    .insert({
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      certificate_number: certificateNumber,
      status: "issued",
      issued_at: new Date().toISOString(),
      verification_code: verificationCodeForInsert,
    })
    .select("*")
    .single();

  if (insertError)
    throw new Error(`Failed to insert certificate: ${insertError.message}`);

  const verificationCode = cert.verification_code;
  const verificationUrl = `${APP_URL}/verify/${verificationCode}`;

  // Generate certificate file from the VIFM .pptx template (mirrors OpsSys).
  const { buffer, mimeType, extension } = await generateCertificateFile(
    {
      userName,
      courseName,
      certificateNumber,
      issuedAt: cert.issued_at,
      verificationUrl,
    },
    templateConfig
  );

  // Upload to Supabase Storage
  const filePath = `${userId}/${cert.id}.${extension}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("certificates")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Certificate upload failed:", uploadError);
    // Non-fatal — certificate record still exists
    return cert as Certificate;
  }

  // Update certificate with PDF URL and verification URL
  const { data: publicUrl } = supabaseAdmin.storage
    .from("certificates")
    .getPublicUrl(filePath);

  const { data: updated } = await supabaseAdmin
    .from("certificates")
    .update({
      pdf_url: publicUrl.publicUrl,
      verification_url: verificationUrl,
    })
    .eq("id", cert.id)
    .select("*")
    .single();

  // Safety-net badge issuance — idempotent on (courseId, userId), so if the
  // course-completion trigger already fired, this is a no-op at the badges
  // service. Catches cases where a certificate is issued without going
  // through the lesson-completion path (e.g. admin manual issue).
  const stored = (
    course as { badge_template_external_id?: string | null } | null
  )?.badge_template_external_id ?? null;
  if (isBadgesEnabled() && stored) {
    (async () => {
      let templateId = stored;
      if (stored === "AUTO") {
        const ensured = await ensureCourseBadgeTemplate({
          courseId,
          courseTitle: courseName,
        });
        if (!ensured.ok || !ensured.data?.id) {
          console.warn(
            `[badges] auto-resolve failed (cert path) for course=${courseId}: ${ensured.error}`
          );
          return;
        }
        templateId = ensured.data.id;
      }
      return issueCourseBadge({
        userId,
        userName,
        userEmail:
          (profile as { email?: string | null } | null)?.email ?? undefined,
        courseId,
        courseTitle: courseName,
        templateExternalId: templateId,
      });
    })()
      .then((r) => {
        if (r && !r.ok) {
          console.warn(
            `[badges] issue from certificate failed for user=${userId} course=${courseId}: ${r.error}`
          );
        }
      })
      .catch((err) => console.warn("[badges] issue from certificate threw", err));
  }

  return (updated ?? cert) as Certificate;
}

/**
 * Resolve the template config for a course: its assigned template, else the
 * default. Returns undefined when no template exists (the generator then uses
 * its bundled fallback design).
 */
async function resolveTemplateConfig(
  certificateTemplateId: string | null,
): Promise<TemplateConfig | undefined> {
  const toConfig = (t: Record<string, unknown>): TemplateConfig => ({
    templateKey: t.template_key as TemplateConfig["templateKey"],
    primaryColor: t.primary_color as string,
    secondaryColor: t.secondary_color as string,
    accentColor: t.accent_color as string,
    logoUrl: (t.logo_url as string | null) ?? null,
    organizationName: t.organization_name as string,
    pptxPath: (t.pptx_path as string | null) ?? null,
    placeholderValues:
      (t.placeholder_values as Record<string, string> | null) ?? null,
  });

  if (certificateTemplateId) {
    const { data: template } = await supabaseAdmin
      .from("certificate_templates")
      .select("*")
      .eq("id", certificateTemplateId)
      .single();
    if (template) return toConfig(template);
  }

  const { data: defaultTemplate } = await supabaseAdmin
    .from("certificate_templates")
    .select("*")
    .eq("is_default", true)
    .single();
  return defaultTemplate ? toConfig(defaultTemplate) : undefined;
}

/**
 * Re-render an existing certificate's source file from the CURRENT template and
 * overwrite the stored .pptx, then drop any cached PDF so the next download
 * re-converts with the new design. Use to apply a new/changed template to old
 * certificates. The certificate row (number, dates, verification) is unchanged.
 */
export async function regenerateCertificateFile(certId: string): Promise<void> {
  const { data: cert } = await supabaseAdmin
    .from("certificates")
    .select(
      "id, user_id, course_id, certificate_number, issued_at, verification_code, verification_url",
    )
    .eq("id", certId)
    .single();
  if (!cert) throw new Error("Certificate not found");

  const [{ data: profile }, { data: course }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", cert.user_id)
      .single(),
    supabaseAdmin
      .from("courses")
      .select("title, certificate_template_id")
      .eq("id", cert.course_id)
      .single(),
  ]);

  const templateConfig = await resolveTemplateConfig(
    course?.certificate_template_id ?? null,
  );
  const verificationUrl =
    cert.verification_url ?? `${APP_URL}/verify/${cert.verification_code}`;

  const { buffer, mimeType, extension } = await generateCertificateFile(
    {
      userName: profile?.full_name ?? "Learner",
      courseName: course?.title ?? "Course",
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at,
      verificationUrl,
    },
    templateConfig,
  );

  const pptxPath = `${cert.user_id}/${cert.id}.${extension}`;
  await supabaseAdmin.storage
    .from("certificates")
    .upload(pptxPath, buffer, { contentType: mimeType, upsert: true });
  // Drop the cached PDF so the next download re-converts with the new design.
  await supabaseAdmin.storage
    .from("certificates")
    .remove([`${cert.user_id}/${cert.id}.pdf`]);

  const { data: pub } = supabaseAdmin.storage
    .from("certificates")
    .getPublicUrl(pptxPath);
  await supabaseAdmin
    .from("certificates")
    .update({ pdf_url: pub.publicUrl, verification_url: verificationUrl })
    .eq("id", cert.id);
}
