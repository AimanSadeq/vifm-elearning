import { NextRequest } from "next/server";

import { CATALOG_CACHE, bad, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/** GET /api/public/designations/:slug */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  if (!slug) return bad("A designation slug is required");

  const { data, error } = await supabaseAdmin
    .from("designations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[public/designations/:slug]", error.message);
    return bad("Could not load that designation", 500);
  }
  if (!data) return bad("Designation not found", 404);
  return ok(data, { headers: CATALOG_CACHE });
}
