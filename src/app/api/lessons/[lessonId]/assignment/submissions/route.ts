import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCompletedLessonIds } from "@/lib/services/progress-service";
import {
  getAssignmentMeta,
  upsertSubmission,
} from "@/lib/services/assignment-service";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

/**
 * Submit (or edit) an assignment response. First successful insert
 * also marks the lesson complete for this learner — keeps the rest
 * of the progress system (overallProgress, course completion, etc.)
 * working without any special-casing.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const meta = await getAssignmentMeta(lessonId);
  if (!meta)
    return NextResponse.json(
      { error: "Not an assignment lesson" },
      { status: 404 }
    );

  const body = await request.json().catch(() => ({}));
  const textResponse =
    typeof body.text_response === "string"
      ? body.text_response.slice(0, 50_000)
      : null;
  const fileUrl = typeof body.file_url === "string" ? body.file_url : null;
  const fileName = typeof body.file_name === "string" ? body.file_name : null;
  const fileSize = typeof body.file_size === "number" ? body.file_size : null;

  // At least one of the allowed channels must have content.
  const hasFile = Boolean(fileUrl) && meta.assignment_allow_file;
  const hasText =
    Boolean(textResponse && textResponse.trim().length > 0) &&
    meta.assignment_allow_text;
  if (!hasFile && !hasText) {
    return NextResponse.json(
      { error: "Submit a file or write a response (at least one required)." },
      { status: 400 }
    );
  }

  // Enrollment gate — only enrolled learners can submit (admins bypass).
  const isAdmin = user.app_metadata?.role === "super_admin";
  const { data: enrollment } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", meta.courseId)
    .maybeSingle();

  if (!isAdmin && !enrollment)
    return NextResponse.json(
      { error: "Not enrolled in this course" },
      { status: 403 }
    );

  const result = await upsertSubmission({
    userId: user.id,
    lessonId,
    courseId: meta.courseId,
    enrollmentId: enrollment?.id ?? null,
    textResponse,
    fileUrl,
    fileName,
    fileSize,
  });
  if (!result.ok)
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 }
    );

  // Mark the lesson complete on first submission — mirrors the manual
  // "Mark Complete" flow so course progression keeps working.
  await supabaseAdmin
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        course_id: meta.courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  // Best-effort enrollment progress sync so a single course-end
  // assignment can also drive courseCompleted -> certificate/badge.
  if (enrollment) {
    const { data: e } = await supabaseAdmin
      .from("enrollments")
      .select("completed_lesson_ids, total_lesson_items")
      .eq("id", enrollment.id)
      .single();
    // Count from lesson_progress (just upserted above), not the lossy array.
    const completedIds = await getCompletedLessonIds(user.id, meta.courseId);
    const totalItems = e?.total_lesson_items ?? 0;
    const completedItems = completedIds.length;
    const progressPct =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const courseCompleted = totalItems > 0 && completedItems >= totalItems;
    await supabaseAdmin
      .from("enrollments")
      .update({
        last_lesson_id: lessonId,
        last_accessed_at: new Date().toISOString(),
        completed_lesson_ids: completedIds,
        completed_lesson_items: completedItems,
        progress_percentage: progressPct,
        ...(courseCompleted
          ? { status: "completed", completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", enrollment.id);
  }

  return NextResponse.json({ data: result.data });
}
