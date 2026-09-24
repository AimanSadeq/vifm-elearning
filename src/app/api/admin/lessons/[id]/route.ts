import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsLesson } from "@/lib/services/admin-auth";
import { isAllowedVideoUrl, pickLessonFields, VIDEO_URL_ERROR } from "@/lib/api/lesson-fields";

/**
 * PATCH /api/admin/lessons/:id
 *
 * Updates a lesson's editable fields. A browser `update().eq("id", …)` needs
 * SELECT on `lessons.id` for the WHERE clause, which `authenticated` no longer
 * has, so edits go through here. The lesson cannot be moved to another course
 * or module this way; reordering has its own route.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    if (!(await adminOwnsLesson(auth.admin, lessonId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updateData = pickLessonFields(body);
    // content_type is fixed at creation: the lesson's other columns (quiz row,
    // video settings, assignment fields) are shaped by it.
    delete updateData.content_type;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
    }

    for (const key of ["title", "title_ar"] as const) {
      if (key in updateData) {
        const v = updateData[key];
        updateData[key] = typeof v === "string" && v.trim() ? v.trim() : null;
      }
    }
    if ("title" in updateData || "title_ar" in updateData) {
      const { data: current } = await supabaseAdmin
        .from("lessons")
        .select("title, title_ar")
        .eq("id", lessonId)
        .maybeSingle();
      const title = "title" in updateData ? updateData.title : current?.title;
      const titleAr = "title_ar" in updateData ? updateData.title_ar : current?.title_ar;
      if (!title && !titleAr) {
        return NextResponse.json(
          { error: "At least one of title/title_ar is required" },
          { status: 400 }
        );
      }
    }

    if (
      updateData.video_url != null &&
      (typeof updateData.video_url !== "string" || !isAllowedVideoUrl(updateData.video_url))
    ) {
      return NextResponse.json({ error: VIDEO_URL_ERROR }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .update(updateData)
      .eq("id", lessonId)
      .select()
      .single();

    if (error) {
      console.error("Lesson update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Lesson update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/lessons/:id
 *
 * Deletes go through here for the same reason as PATCH.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    if (!(await adminOwnsLesson(auth.admin, lessonId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from("lessons").delete().eq("id", lessonId);
    if (error) {
      console.error("Lesson delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson delete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
