import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // Support both JSON body and sendBeacon (which sends as text/plain sometimes)
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId, lessonId, courseId, progressSeconds, isCompleted } = body;

    if (!userId || !lessonId || !courseId) {
      return NextResponse.json(
        { error: "userId, lessonId, and courseId are required" },
        { status: 400 }
      );
    }

    // Verify auth - for sendBeacon we may not have auth cookies,
    // so we accept the userId from the payload
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If auth is available, verify the userId matches
    if (user && user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = Number(progressSeconds) || 0;
    const completed = Boolean(isCompleted);

    // Upsert lesson progress
    const { error: progressError } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: userId as string,
          lesson_id: lessonId as string,
          course_id: courseId as string,
          progress_seconds: Math.floor(progress),
          max_progress_seconds: Math.floor(progress),
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError) {
      console.error("Progress save error:", progressError);
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    // Update enrollment last_lesson_id
    await supabase
      .from("enrollments")
      .update({
        last_lesson_id: lessonId as string,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("user_id", userId as string)
      .eq("course_id", courseId as string);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
