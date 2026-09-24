import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsLesson } from "@/lib/services/admin-auth";
import { isAllowedVideoUrl, VIDEO_URL_ERROR } from "@/lib/api/lesson-fields";

const videoUrlSchema = z.object({
  video_url: z
    .string()
    .trim()
    .min(1, "video_url is required")
    .max(2048)
    .refine(isAllowedVideoUrl, { message: VIDEO_URL_ERROR }),
  video_duration_seconds: z.number().int().positive().optional(),
});

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

    const parsed = videoUrlSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { video_url, video_duration_seconds } = parsed.data;

    const updateData: Record<string, unknown> = {
      video_url,
    };

    if (video_duration_seconds !== undefined) {
      updateData.video_duration_seconds = video_duration_seconds;
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
