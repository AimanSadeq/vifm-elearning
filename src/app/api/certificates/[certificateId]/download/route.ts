import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  convertPptxToPdf,
  isPdfConversionConfigured,
} from "@/lib/services/pptx-pdf";

// Serves the learner's certificate as a PDF rendered from the admin template.
// The template-based .pptx is generated at issuance and stored; here we convert
// it to PDF (CloudConvert) and cache the result, so it matches whatever template
// the course/default uses. Falls back (503) when no converter is configured so
// the client can use the built-in renderer instead.
export const runtime = "nodejs";

const BUCKET = "certificates";

function pdfResponse(buf: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const { certificateId } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cert } = await supabaseAdmin
    .from("certificates")
    .select("id, user_id, certificate_number")
    .eq("id", certificateId)
    .maybeSingle();
  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin";
  if (cert.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerId = cert.user_id as string;
  const fileName = String(cert.certificate_number || "certificate").replace(
    /[^a-z0-9-]+/gi,
    "-",
  );
  const pdfPath = `${ownerId}/${cert.id}.pdf`;
  const pptxPath = `${ownerId}/${cert.id}.pptx`;

  // 1. Cached PDF from a previous download.
  const { data: cached } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(pdfPath);
  if (cached) {
    return pdfResponse(Buffer.from(await cached.arrayBuffer()), fileName);
  }

  if (!isPdfConversionConfigured()) {
    return NextResponse.json(
      { error: "PDF conversion not configured", code: "NO_CONVERTER" },
      { status: 503 },
    );
  }

  // 2. Fetch the template-rendered .pptx generated at issuance.
  const { data: pptxBlob } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(pptxPath);
  if (!pptxBlob) {
    return NextResponse.json(
      { error: "Certificate source file not found", code: "NO_SOURCE" },
      { status: 404 },
    );
  }

  // 3. Convert + cache.
  let pdf: Buffer;
  try {
    pdf = await convertPptxToPdf(
      Buffer.from(await pptxBlob.arrayBuffer()),
      `${fileName}.pptx`,
    );
  } catch (err) {
    console.error("[cert pdf] conversion failed:", err);
    return NextResponse.json(
      { error: "Conversion failed", code: "CONVERT_FAILED" },
      { status: 502 },
    );
  }
  await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pdfPath, new Uint8Array(pdf), {
      contentType: "application/pdf",
      upsert: true,
    });

  return pdfResponse(pdf, fileName);
}
