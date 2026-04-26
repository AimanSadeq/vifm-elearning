import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsLesson } from "@/lib/services/admin-auth";

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

    const body = await request.json();
    const { video_url, video_duration_seconds } = body as {
      video_url?: string;
      video_duration_seconds?: number;
    };

    if (!video_url) {
      return NextResponse.json(
        { error: "video_url is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      video_url: video_url.trim(),
    };

    if (
      video_duration_seconds !== undefined &&
      typeof video_duration_seconds === "number" &&
      video_duration_seconds > 0
    ) {
      updateData.video_duration_seconds = Math.round(video_duration_seconds);
    }

    const { error: updateError } = await supabaseAdmin
      .from("lessons")
      .update(updateData)
      .eq("id", lessonId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[video-url] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
