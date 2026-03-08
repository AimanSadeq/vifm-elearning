import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/lessons/[id]/video-url
 *
 * Sets or updates the video_url (and optionally video_duration_seconds)
 * on a lesson. Used for external video URLs that don't go through
 * the file upload pipeline.
 *
 * Body: { video_url: string, video_duration_seconds?: number }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    // 1. Auth check
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Role check
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse body
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

    // 4. Update lesson
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
