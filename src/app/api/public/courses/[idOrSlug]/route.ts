import { NextRequest } from "next/server";

import { CATALOG_CACHE, COURSE_SELECT, bad, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ idOrSlug: string }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/public/courses/:idOrSlug
 *
 * One published course, addressed by either id or slug. Restricted to
 * `published`: without that filter a draft or archived course is fetchable by
 * anyone who guesses the slug.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { idOrSlug } = await params;
  if (!idOrSlug) return bad("A course id or slug is required");

  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_SELECT)
    .eq(UUID.test(idOrSlug) ? "id" : "slug", idOrSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public/courses/:idOrSlug]", error.message);
    return bad("Could not load that course", 500);
  }
  if (!data) return bad("Course not found", 404);

  return ok(data, { headers: CATALOG_CACHE });
}
