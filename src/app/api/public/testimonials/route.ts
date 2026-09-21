import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET /api/public/testimonials — active testimonials, in display order. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[public/testimonials]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }
  return ok(data ?? [], { headers: CATALOG_CACHE });
}
