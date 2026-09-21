import { NextResponse } from "next/server";

/**
 * Shared shapes for the public read API under `/api/public/*`.
 *
 * These routes exist because the website had no read endpoints for the
 * catalogue at all — those pages are Next.js server components that query
 * Supabase directly, so there was nothing a second client could call. The
 * mobile app therefore talked to PostgREST itself. These give it a real API.
 *
 * They read with the service role and filter to published/active rows, so the
 * response never depends on the caller's own grants.
 */

/** The embed the app's `Course.fromJson` expects. */
export const COURSE_SELECT =
  "*, category:categories(*), instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)";

export function ok<T>(data: T, init?: { headers?: Record<string, string> }) {
  return NextResponse.json({ data }, { headers: init?.headers });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Cache header for catalogue reads. Short, because an admin publishing a course
 * should show up quickly, but enough to absorb a burst of app launches.
 */
export const CATALOG_CACHE = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

/** Clamped paging, so a caller cannot ask for the whole table. */
export function paging(url: URL, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const rawLimit = Number(url.searchParams.get("limit") ?? defaultLimit);
  const rawOffset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;
  return { limit, offset, from: offset, to: offset + limit - 1 };
}

/**
 * Escapes a value going into a PostgREST `or=(…ilike…)` filter.
 *
 * Unescaped commas and parentheses in a search term do not error — they change
 * the filter's structure, which is how a search box becomes a query-injection
 * point. The app hit exactly this and now escapes on its side too.
 */
export function escapeFilterValue(value: string): string {
  return value.replace(/[(),\\]/g, (c) => `\\${c}`);
}
