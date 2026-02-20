import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const userId = searchParams.get("userId");

    if (!lessonId || !userId) {
      return NextResponse.json(
        { error: "lessonId and userId are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .single();

    if (!progress) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      userId,
      lessonId,
      courseId,
      progressSeconds,
      isCompleted,
      progressPercentage,
      videoCompleted,
      totalWatchTimeDelta,
      isNewSession,
      watchedSegments,
    } = body;

    if (!userId || !lessonId || !courseId) {
      return NextResponse.json(
        { error: "userId, lessonId, and courseId are required" },
        { status: 400 }
      );
    }

    // Verify auth — for sendBeacon we may not have auth cookies,
    // so we accept the userId from the payload
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = Number(progressSeconds) || 0;
    const completed = Boolean(isCompleted);
    const vCompleted = Boolean(videoCompleted);
    const delta = Number(totalWatchTimeDelta) || 0;
    const pctg = Number(progressPercentage) || 0;

    // Fetch existing progress for merging
    const { data: existing } = await supabase
      .from("lesson_progress")
      .select("watched_segments, view_count, total_watch_time_delta_accumulated, first_viewed_at, max_progress_seconds, video_completed")
      .eq("user_id", userId as string)
      .eq("lesson_id", lessonId as string)
      .single();

    // Merge watched segments with OR logic (never regress)
    let mergedSegments: boolean[] = [];
    if (watchedSegments && Array.isArray(watchedSegments)) {
      const existingSegments = (existing?.watched_segments as boolean[]) ?? [];
      const incoming = watchedSegments as boolean[];
      const len = Math.max(existingSegments.length, incoming.length);
      mergedSegments = Array.from({ length: len }, (_, i) =>
        Boolean(existingSegments[i]) || Boolean(incoming[i])
      );
    } else if (existing?.watched_segments) {
      mergedSegments = existing.watched_segments as boolean[];
    }

    // Increment view_count on new session
    const currentViewCount = existing?.view_count ?? 0;
    const newViewCount = isNewSession ? currentViewCount + 1 : currentViewCount;

    // Accumulate watch time delta
    const accumulatedDelta =
      (existing?.total_watch_time_delta_accumulated ?? 0) + delta;

    // Never regress max_progress_seconds
    const maxProgress = Math.max(
      existing?.max_progress_seconds ?? 0,
      Math.floor(progress)
    );

    // Never regress video_completed
    const finalVideoCompleted = vCompleted || Boolean(existing?.video_completed);

    // Upsert lesson progress
    const { error: progressError } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: userId as string,
          lesson_id: lessonId as string,
          course_id: courseId as string,
          progress_seconds: Math.floor(progress),
          max_progress_seconds: maxProgress,
          is_completed: completed,
          video_completed: finalVideoCompleted,
          completed_at: completed ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString(),
          first_viewed_at: existing?.first_viewed_at ?? new Date().toISOString(),
          view_count: newViewCount,
          watched_segments: mergedSegments,
          total_watch_time_delta_accumulated: accumulatedDelta,
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

    // Update enrollment: last_lesson_id, accumulate time, manage completed_lesson_ids
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, completed_lesson_ids, total_time_spent_seconds, total_lesson_items")
      .eq("user_id", userId as string)
      .eq("course_id", courseId as string)
      .single();

    if (enrollment) {
      const completedIds: string[] = (enrollment.completed_lesson_ids as string[]) ?? [];
      const lid = lessonId as string;

      // Add to completed list if completed and not already present
      if (completed && !completedIds.includes(lid)) {
        completedIds.push(lid);
      }

      const totalTime = (enrollment.total_time_spent_seconds ?? 0) + delta;
      const totalItems = enrollment.total_lesson_items ?? 0;
      const completedItems = completedIds.length;
      const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : pctg;

      await supabase
        .from("enrollments")
        .update({
          last_lesson_id: lid,
          last_accessed_at: new Date().toISOString(),
          completed_lesson_ids: completedIds,
          completed_lesson_items: completedItems,
          total_time_spent_seconds: totalTime,
          progress_percentage: progressPct,
        })
        .eq("id", enrollment.id);
    } else {
      // Fallback: just update last_lesson_id
      await supabase
        .from("enrollments")
        .update({
          last_lesson_id: lessonId as string,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("user_id", userId as string)
        .eq("course_id", courseId as string);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
