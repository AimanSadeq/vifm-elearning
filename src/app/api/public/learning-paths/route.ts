import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GET /api/public/learning-paths — published paths with their courses. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("learning_paths")
    .select("*, courses:learning_path_courses(course:courses(*))")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[public/learning-paths]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }
  return ok(data ?? [], { headers: CATALOG_CACHE });
}
