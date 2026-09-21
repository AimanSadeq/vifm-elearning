import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET /api/public/subscription-plans — the plans on offer. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) {
    console.error("[public/subscription-plans]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }
  return ok(data ?? [], { headers: CATALOG_CACHE });
}
