import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET /api/public/designations — active certification designations. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("designations")
    .select("*")
    .eq("is_active", true)
    .order("founding_fee", { ascending: true });

  if (error) {
    console.error("[public/designations]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }
  return ok(data ?? [], { headers: CATALOG_CACHE });
}
