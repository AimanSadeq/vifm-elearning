import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { regenerateCertificateFile } from "@/lib/services/certificate-service";

export const runtime = "nodejs";

// Re-render is local (pptx) + a couple of storage ops per cert; bound per call.
const BATCH = 20;

/**
 * POST /api/admin/certificates/regenerate?offset=N
 *
 * Re-renders existing certificates' source files from the CURRENT template and
 * clears their cached PDFs, so old certificates pick up a new/changed template.
 * Paginated by a stable order; the client loops offset until done.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offset = Math.max(
    0,
    Number(request.nextUrl.searchParams.get("offset")) || 0,
  );

  const { count } = await supabaseAdmin
    .from("certificates")
    .select("id", { count: "exact", head: true });
  const total = count ?? 0;

  const { data: certs } = await supabaseAdmin
    .from("certificates")
    .select("id")
    .order("issued_at", { ascending: true })
    .range(offset, offset + BATCH - 1);

  let regenerated = 0;
  let failed = 0;
  for (const c of certs ?? []) {
    try {
      await regenerateCertificateFile(c.id as string);
      regenerated += 1;
    } catch (err) {
      console.error("[cert regenerate] failed for", c.id, err);
      failed += 1;
    }
  }

  const nextOffset = offset + (certs?.length ?? 0);
  return NextResponse.json({
    data: {
      total,
      processed: certs?.length ?? 0,
      regenerated,
      failed,
      nextOffset,
      done: nextOffset >= total,
    },
  });
}
