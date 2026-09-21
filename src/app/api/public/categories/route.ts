import { NextRequest } from "next/server";

import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/public/categories
 *
 * Active categories. `?withPublishedCourses=true` returns only those that have
 * at least one published course — the app's home and catalogue both need that
 * and used to answer it by reading the entire catalogue a second time.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const onlyPopulated = url.searchParams.get("withPublishedCourses") === "true";

  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[public/categories]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }

  if (!onlyPopulated) return ok(categories ?? [], { headers: CATALOG_CACHE });

  const { data: populated } = await supabaseAdmin
    .from("courses")
    .select("category_id")
    .eq("status", "published")
    .not("category_id", "is", null);

  const ids = new Set((populated ?? []).map((r) => String(r.category_id)));
  return ok(
    (categories ?? []).filter((c) => ids.has(String(c.id))),
    { headers: CATALOG_CACHE }
  );
}
