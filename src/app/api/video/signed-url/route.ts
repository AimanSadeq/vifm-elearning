import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { SIGNED_URL_EXPIRY } from "@/lib/utils/constants";
import { createCourseVideoSignedUrl } from "@/lib/supabase/video-storage";

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("video_url, video_hls_url, course_id, is_preview")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // If not preview, verify enrollment
    if (!lesson.is_preview) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", lesson.course_id)
        .eq("status", "active")
        .single();

      if (!enrollment) {
        return NextResponse.json(
          { error: "Not enrolled in this course" },
          { status: 403 }
        );
      }
    }

    const videoPath = lesson.video_hls_url || lesson.video_url;
    if (!videoPath) {
      return NextResponse.json(
        { error: "No video available" },
        { status: 404 }
      );
    }

    // Try course-videos bucket first (new), fall back to legacy videos bucket
    const { url: courseVideoUrl } = await createCourseVideoSignedUrl(
      videoPath,
      SIGNED_URL_EXPIRY
    );

    if (courseVideoUrl) {
      return NextResponse.json({ url: courseVideoUrl });
    }

    // Fallback: legacy "videos" bucket
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: signedUrl, error: signError } = await adminClient.storage
      .from("videos")
      .createSignedUrl(videoPath, SIGNED_URL_EXPIRY);

    if (signError || !signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
