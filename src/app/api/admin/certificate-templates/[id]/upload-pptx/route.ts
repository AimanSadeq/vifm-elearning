import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { discoverPlaceholders } from "@/lib/cert-layout/discover-placeholders";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * POST /api/admin/certificate-templates/:id/upload-pptx
 *
 * Multipart form-data with `file` field containing a .pptx. Stored under the
 * `certificates` bucket at `templates/<templateId>.pptx`. The path is then
 * pinned onto the row, taking precedence over any saved JSON layout the next
 * time a certificate is issued from this template.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be smaller than 25MB" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Sniff the zip header — .pptx is a zip. Don't trust the browser's MIME
  // hint, and don't trust the filename alone. Local zip header = 0x50 0x4B
  // 0x03 0x04. Empty zip header (0x50 0x4B 0x05 0x06) wouldn't be a valid
  // .pptx but this is a sanity check, not a parser.
  if (
    buffer[0] !== 0x50 ||
    buffer[1] !== 0x4b ||
    buffer[2] !== 0x03 ||
    buffer[3] !== 0x04
  ) {
    return NextResponse.json(
      { error: "File does not look like a .pptx (missing zip header)" },
      { status: 400 }
    );
  }
  // Belt and suspenders: also reject if the filename / declared MIME tells us
  // it isn't .pptx and we *did* recognise some zip header (e.g. .docx, .xlsx).
  const lowerName = file.name.toLowerCase();
  if (
    file.type &&
    file.type !== PPTX_MIME &&
    file.type !== "application/zip" &&
    file.type !== "application/x-zip-compressed" &&
    !lowerName.endsWith(".pptx")
  ) {
    return NextResponse.json(
      { error: "Only .pptx files are allowed" },
      { status: 400 }
    );
  }

  const path = `templates/${id}.pptx`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("certificates")
    .upload(path, buffer, {
      contentType: PPTX_MIME,
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Discover placeholders so the editor can populate its panel without a
  // second round-trip + the admin can map values to any custom tokens.
  let placeholders: string[] = [];
  try {
    placeholders = discoverPlaceholders(buffer);
  } catch {
    // Bad zip handled by the header sniff above; if discovery fails here,
    // we still want the upload to succeed and the admin to see the file.
  }

  const { error: updateError } = await supabaseAdmin
    .from("certificate_templates")
    .update({ pptx_path: path })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pptx_path: path, placeholders });
}

/**
 * DELETE /api/admin/certificate-templates/:id/upload-pptx — clears the
 * per-template .pptx override so the row reverts to its JSON layout / the
 * bundled default.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const path = `templates/${id}.pptx`;
  await supabaseAdmin.storage.from("certificates").remove([path]);
  await supabaseAdmin
    .from("certificate_templates")
    .update({ pptx_path: null })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
