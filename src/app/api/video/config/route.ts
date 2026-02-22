import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  VIDEO_DEFAULT_MINIMUM_WATCH_PERCENTAGE,
  VIDEO_DEFAULT_AUTO_SAVE_INTERVAL_SECONDS,
  VIDEO_DEFAULT_ALLOW_SPEED_CONTROL,
  VIDEO_DEFAULT_ALLOW_DOWNLOAD,
  VIDEO_DEFAULT_ALLOW_SKIPPING,
  VIDEO_DEFAULT_FORCE_WATCH_FIRST,
} from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId query param is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch per-lesson config (including course_id for enrollment check)
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(
        "minimum_watch_percentage, allow_speed_control, allow_download, allow_skipping, auto_save_interval_seconds, force_watch_first, is_preview, module:modules!inner(course_id)"
      )
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Verify enrollment unless this is a preview lesson
    if (!lesson.is_preview) {
      const courseId = (lesson.module as unknown as { course_id: string })?.course_id;
      if (courseId) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .single();

        if (!enrollment) {
          return NextResponse.json(
            { error: "Not enrolled in this course" },
            { status: 403 }
          );
        }
      }
    }

    // Check if this is a first watch (no progress or video not completed)
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("video_completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single();

    const isFirstWatch = !progress || !progress.video_completed;

    return NextResponse.json({
      minimumWatchPercentage:
        lesson.minimum_watch_percentage ?? VIDEO_DEFAULT_MINIMUM_WATCH_PERCENTAGE,
      allowSpeedControl:
        lesson.allow_speed_control ?? VIDEO_DEFAULT_ALLOW_SPEED_CONTROL,
      allowDownload:
        lesson.allow_download ?? VIDEO_DEFAULT_ALLOW_DOWNLOAD,
      allowSkipping:
        lesson.allow_skipping ?? VIDEO_DEFAULT_ALLOW_SKIPPING,
      autoSaveIntervalSeconds:
        lesson.auto_save_interval_seconds ?? VIDEO_DEFAULT_AUTO_SAVE_INTERVAL_SECONDS,
      forceWatchFirst:
        lesson.force_watch_first ?? VIDEO_DEFAULT_FORCE_WATCH_FIRST,
      isFirstWatch,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
