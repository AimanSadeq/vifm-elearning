import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { generateCertificateFile } from "@/lib/services/certificate-generator";
import { APP_URL } from "@/lib/env";

/**
 * POST /api/admin/certificate-templates/preview
 *
 * Body:
 *   templateId        — optional, when set the row's pptx_path / org name is
 *                       used so the preview matches what learners will get.
 *   organizationName  — optional override for the {{CLIENT_NAME}} placeholder.
 *
 * Returns the personalized .pptx (or .pdf in the future) as an attachment.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));

  let templatePptxPath: string | null = null;
  let placeholderValues: Record<string, string> | null = null;
  let organizationName: string =
    typeof body.organizationName === "string" && body.organizationName.trim()
      ? body.organizationName.trim()
      : "VIFM Academy";

  if (typeof body.templateId === "string") {
    const { data: row } = await supabaseAdmin
      .from("certificate_templates")
      .select("organization_name, pptx_path, placeholder_values")
      .eq("id", body.templateId)
      .single();
    if (row) {
      templatePptxPath =
        ((row as { pptx_path?: string | null }).pptx_path) ?? null;
      placeholderValues =
        ((row as { placeholder_values?: Record<string, string> | null })
          .placeholder_values) ?? null;
      // If the caller already typed a different org name in the form, prefer
      // the typed value; otherwise fall back to the row.
      if (!body.organizationName && row.organization_name) {
        organizationName = row.organization_name;
      }
    }
  }

  const { buffer, mimeType } = await generateCertificateFile(
    {
      userName: "Sample Learner Name",
      courseName: "Sample Course Title — Replace With Your Course",
      certificateNumber: "VIFM-PREVIEW-0001",
      issuedAt: new Date().toISOString(),
      verificationUrl: `${APP_URL}/verify/PREVIEW`,
    },
    {
      templateKey: "classic",
      primaryColor: "#134BA1",
      secondaryColor: "#D4AF37",
      accentColor: "#4B5563",
      organizationName,
      pptxPath: templatePptxPath,
      placeholderValues,
    }
  );

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition":
        'attachment; filename="vifm-certificate-preview.pptx"',
      "Cache-Control": "no-store",
    },
  });
}
