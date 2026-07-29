import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  convertPptx,
  isPdfConversionConfigured,
} from "@/lib/services/pptx-pdf";

// Serves the learner's certificate (PDF or PNG) rendered from the admin
// template. The template-based .pptx is generated at issuance and stored; here
// we convert it to the requested format (CloudConvert) and cache the result, so
// it matches whatever template the course/default uses. Falls back (503) when
// no converter is configured so the client can use the built-in renderer.
import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
export const runtime = "nodejs";

const BUCKET = "certificates";

function fileResponse(buf: Buffer, filename: string, contentType: string) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const { certificateId } = await params;
  const format =
    request.nextUrl.searchParams.get("format") === "png" ? "png" : "pdf";
  const contentType = format === "png" ? "image/png" : "application/pdf";

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

  // Own role — read via my_profile; `profiles.role` is not granted
  // to `authenticated` any more.
  const profile = { role: await getOwnRole(supabase) };
  const isAdmin = profile?.role === "super_admin";
  if (cert.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerId = cert.user_id as string;
  const base = String(cert.certificate_number || "certificate").replace(
    /[^a-z0-9-]+/gi,
    "-",
  );
  const outPath = `${ownerId}/${cert.id}.${format}`;
  const pptxPath = `${ownerId}/${cert.id}.pptx`;

  // 1. Cached output from a previous download.
  const { data: cached } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(outPath);
  if (cached) {
    return fileResponse(
      Buffer.from(await cached.arrayBuffer()),
      `${base}.${format}`,
      contentType,
    );
  }

  if (!isPdfConversionConfigured()) {
    return NextResponse.json(
      { error: "Conversion not configured", code: "NO_CONVERTER" },
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
  let out: Buffer;
  try {
    out = await convertPptx(
      Buffer.from(await pptxBlob.arrayBuffer()),
      format,
      `${base}.pptx`,
    );
  } catch (err) {
    console.error("[cert download] conversion failed:", err);
    return NextResponse.json(
      { error: "Conversion failed", code: "CONVERT_FAILED" },
      { status: 502 },
    );
  }
  await supabaseAdmin.storage
    .from(BUCKET)
    .upload(outPath, new Uint8Array(out), { contentType, upsert: true });

  return fileResponse(out, `${base}.${format}`, contentType);
}
