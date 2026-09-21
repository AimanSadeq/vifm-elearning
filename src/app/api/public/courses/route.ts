import { NextRequest } from "next/server";

import {
  CATALOG_CACHE,
  COURSE_SELECT,
  escapeFilterValue,
  ok,
  paging,
} from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/utils/rate-limit";

/**
 * GET /api/public/courses
 *
 * The published catalogue, with the same search, filter, ordering and paging the
 * app previously did against PostgREST directly.
 *
 * Query: `search`, `categoryId`, `limit` (≤50), `offset`.
 */
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, {
    scope: "public:courses",
    buckets: [
      { limit: 60, windowMs: 60_000 },
      { limit: 600, windowMs: 60 * 60_000 },
    ],
  });
  if (limited) return limited;

  const url = new URL(request.url);
  const { limit, offset, from, to } = paging(url);

  let query = supabaseAdmin
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published");

  const categoryId = url.searchParams.get("categoryId");
  if (categoryId) query = query.eq("category_id", categoryId);

  const search = url.searchParams.get("search")?.trim();
  if (search) {
    const term = escapeFilterValue(`%${search}%`);
    query = query.or(`title.ilike.${term},title_ar.ilike.${term}`);
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[public/courses]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }

  return ok(data ?? [], {
    headers: {
      ...CATALOG_CACHE,
      // Lets the client know whether to offer another page without a count query.
      "X-Page-Limit": String(limit),
      "X-Page-Offset": String(offset),
    },
  });
}
