import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateCertificatePdf, type TemplateConfig } from "./certificate-generator";
import type { Certificate } from "@/types";

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

  // Generate certificate number via DB function
  const { data: certNumResult } = await supabaseAdmin.rpc(
    "generate_certificate_number",
    { p_course_id: courseId }
  );
  const certificateNumber =
    certNumResult ?? `VIFM-${Date.now()}`;

  // Get user, course info, and certificate template
  const [{ data: profile }, { data: course }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("courses")
      .select("title, certificate_template_id")
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
      };
    }
  }

  // Insert certificate record first to get the verification_code
  const { data: cert, error: insertError } = await supabaseAdmin
    .from("certificates")
    .insert({
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      certificate_number: certificateNumber,
      status: "issued",
      issued_at: new Date().toISOString(),
      template_id: course?.certificate_template_id ?? null,
    })
    .select("*")
    .single();

  if (insertError)
    throw new Error(`Failed to insert certificate: ${insertError.message}`);

  const verificationCode = cert.verification_code;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://academy.vifm.ae";
  const verificationUrl = `${baseUrl}/verify/${verificationCode}`;

  // Generate PDF with template
  const pdfBuffer = await generateCertificatePdf(
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
  const filePath = `${userId}/${cert.id}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("certificates")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Certificate PDF upload failed:", uploadError);
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

  return (updated ?? cert) as Certificate;
}
