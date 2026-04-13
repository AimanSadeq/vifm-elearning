import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadCourseVideo } from "@/lib/supabase/video-storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // 1. Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check role (must be super_admin or instructor)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId") as string | null;
    const lessonId = formData.get("lessonId") as string | null;
    const durationStr = formData.get("duration") as string | null;

    if (!file || !courseId || !lessonId) {
      return NextResponse.json(
        { error: "file, courseId, and lessonId are required" },
        { status: 400 }
      );
    }

    // 4. Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only MP4, WebM, and MOV files are allowed" },
        { status: 400 }
      );
    }

    // 5. Validate file size (2 GB max)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2 GB." },
        { status: 413 }
      );
    }

    // 5. If instructor, verify they own the course
    if (profile.role === "instructor") {
      const { data: course } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .single();

      if (!course || course.instructor_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 6. Upload to course-videos bucket via service role
    const buffer = Buffer.from(await file.arrayBuffer());
    const { path, error: uploadError } = await uploadCourseVideo(
      courseId,
      file.name,
      buffer,
      file.type
    );

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError}` },
        { status: 500 }
      );
    }

    // 7. Update the lesson record (skip for new-lesson flow where lesson
    // doesn't exist yet — caller will insert the lesson with this video_url)
    if (lessonId !== "pending") {
      const updateData: Record<string, unknown> = { video_url: path };
      if (durationStr) {
        const duration = parseFloat(durationStr);
        if (!isNaN(duration) && duration > 0) {
          updateData.video_duration_seconds = Math.round(duration);
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from("lessons")
        .update(updateData)
        .eq("id", lessonId);

      if (updateError) {
        return NextResponse.json(
          { error: `Lesson update failed: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ path, url: path }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
