import { NextRequest } from "next/server";

import { resolveCaller } from "@/lib/api/caller";
import { bad, ok } from "@/lib/api/public-read";
import { userHasCourseAccess } from "@/lib/services/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ idOrSlug: string }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/public/courses/:idOrSlug/curriculum
 *
 * Modules with their lessons, shaped as the app's `Module.fromJson` expects
 * (`lessons` nested under each module, both sorted by `sort_order`).
 *
 * **Entitlement is applied here, server-side.** Every lesson of a published
 * course is listed — the outline is public, and hiding it would break the course
 * page — but the media and body columns are NULLed unless the caller is entitled
 * or the lesson is a free preview. That is the same rule as the `lesson_access`
 * view, enforced in one place so a client cannot forget which to ask for.
 */
const GATED_COLUMNS = [
  "video_url",
  "video_hls_url",
  "content_html",
  "content_html_ar",
  "document_url",
] as const;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { idOrSlug } = await params;
  if (!idOrSlug) return bad("A course id or slug is required");

  const { data: course } = await supabaseAdmin
    .from("courses")
    .select("id, is_free, instructor_id")
    .eq(UUID.test(idOrSlug) ? "id" : "slug", idOrSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!course) return bad("Course not found", 404);

  const caller = await resolveCaller(request);
  const entitled = caller
    ? await userHasCourseAccess(caller.id, course.id, {
        authMetadata: caller.appMetadata,
        course: { is_free: course.is_free, instructor_id: course.instructor_id },
      })
    : Boolean(course.is_free);

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true }),
  ]);

  const byModule = new Map<string, Record<string, unknown>[]>();
  for (const raw of lessons ?? []) {
    const lesson = { ...raw } as Record<string, unknown>;
    if (!entitled && !lesson.is_preview) {
      for (const column of GATED_COLUMNS) lesson[column] = null;
    }
    const key = String(lesson.module_id);
    const bucket = byModule.get(key);
    if (bucket) bucket.push(lesson);
    else byModule.set(key, [lesson]);
  }

  const payload = (modules ?? []).map((m) => ({
    ...m,
    lessons: byModule.get(String(m.id)) ?? [],
  }));

  // Entitlement-dependent, and therefore never shared between callers.
  return ok(payload, { headers: { "Cache-Control": "private, no-store" } });
}
