import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { discoverPlaceholders } from "@/lib/cert-layout/discover-placeholders";
import { loadActiveTemplate } from "@/lib/cert-layout/load-template";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/certificate-templates/:id/placeholders
 *
 * Returns the placeholders discovered in the template's .pptx (the
 * admin-uploaded one, or the bundled default if none) along with the
 * currently saved `placeholder_values` map. The editor uses this to render
 * the per-token input panel.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("certificate_templates")
    .select("pptx_path, placeholder_values")
    .eq("id", id)
    .single();

  // Reuse the same allowlisted loader the generator uses; bundled fallback
  // happens automatically when pptx_path is null.
  let pptxBuffer: Buffer;
  try {
    pptxBuffer = await loadActiveTemplate(
      (row as { pptx_path?: string | null } | null)?.pptx_path ?? null
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Template fetch failed" },
      { status: 400 }
    );
  }

  let placeholders: string[] = [];
  try {
    placeholders = discoverPlaceholders(pptxBuffer);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Discovery failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    placeholders,
    values:
      (row as { placeholder_values?: Record<string, string> } | null)
        ?.placeholder_values ?? {},
  });
}
