import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsCourse } from "@/lib/services/admin-auth";
import { isAllowedVideoUrl, pickLessonFields, VIDEO_URL_ERROR } from "@/lib/api/lesson-fields";

/**
 * POST /api/admin/lessons
 *
 * Creates a lesson. The console used to insert into `lessons` from the
 * browser, but `authenticated` no longer has SELECT on the table (so
 * `insert().select()` fails with 42501) and the row policy checks `is_admin()`
 * against the JWT claim — so browser inserts no longer work. The service role
 * is not subject to either.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { course_id, module_id } = body as Record<string, unknown>;
    if (typeof course_id !== "string" || typeof module_id !== "string") {
      return NextResponse.json(
        { error: "course_id and module_id are required" },
        { status: 400 }
      );
    }

    const titleEn = typeof body.title === "string" ? body.title.trim() : "";
    const titleAr = typeof body.title_ar === "string" ? body.title_ar.trim() : "";
    if (!titleEn && !titleAr) {
      return NextResponse.json(
        { error: "At least one of title/title_ar is required" },
        { status: 400 }
      );
    }

    if (!(await adminOwnsCourse(auth.admin, course_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // The module must belong to the course, or a lesson could be attached to
    // another instructor's module under a course id this caller owns.
    const { data: mod } = await supabaseAdmin
      .from("modules")
      .select("course_id")
      .eq("id", module_id)
      .maybeSingle();
    if (!mod || mod.course_id !== course_id) {
      return NextResponse.json(
        { error: "Module does not belong to this course" },
        { status: 400 }
      );
    }

    const lessonData: Record<string, unknown> = { ...pickLessonFields(body), course_id, module_id };
    if (
      lessonData.video_url != null &&
      (typeof lessonData.video_url !== "string" || !isAllowedVideoUrl(lessonData.video_url))
    ) {
      return NextResponse.json({ error: VIDEO_URL_ERROR }, { status: 400 });
    }
    lessonData.title = titleEn || null;
    lessonData.title_ar = titleAr || null;

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      console.error("Lesson creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Lesson API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/lessons  { ids: string[] }
 *
 * Bulk delete for the course editor's multi-select. The caller must own the
 * course of every lesson in the list; otherwise nothing is deleted.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    const body = await request.json().catch(() => null);
    const ids: unknown = body?.ids;
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > 500 ||
      !ids.every((id) => typeof id === "string")
    ) {
      return NextResponse.json({ error: "ids must be a non-empty array of lesson ids" }, { status: 400 });
    }

    const { data: lessons, error: readError } = await supabaseAdmin
      .from("lessons")
      .select("id, course_id")
      .in("id", ids);
    if (readError) {
      console.error("Lesson bulk delete lookup error:", readError);
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!lessons || lessons.length !== new Set(ids).size) {
      return NextResponse.json({ error: "Some lessons were not found" }, { status: 404 });
    }

    const courseIds = [...new Set(lessons.map((l) => l.course_id as string))];
    for (const courseId of courseIds) {
      if (!(await adminOwnsCourse(auth.admin, courseId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin.from("lessons").delete().in("id", ids);
    if (error) {
      console.error("Lesson bulk delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Lesson bulk delete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
