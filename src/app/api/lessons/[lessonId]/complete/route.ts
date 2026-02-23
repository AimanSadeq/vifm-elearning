import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recalculateAllPathsForUser } from "@/lib/services/learning-path-service";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { lessonId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse courseId from body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { courseId } = body;
    if (!courseId || typeof courseId !== "string")
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

    // Verify enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id, completed_lesson_ids, total_lesson_items")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["active", "completed"])
      .single();

    if (!enrollment)
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );

    // Upsert lesson_progress as completed
    const { error: progressError } = await supabaseAdmin
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError)
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );

    // Update enrollment completed_lesson_ids and progress
    const completedIds: string[] =
      (enrollment.completed_lesson_ids as string[]) ?? [];

    if (!completedIds.includes(lessonId)) {
      completedIds.push(lessonId);
    }

    const totalItems = enrollment.total_lesson_items ?? 0;
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

    if (courseCompleted) {
      recalculateAllPathsForUser(supabase, user.id).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
