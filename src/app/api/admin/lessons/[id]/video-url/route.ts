import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsLesson } from "@/lib/services/admin-auth";

// video_url is rendered into the player and used to derive signed-URL
// paths from a Supabase Storage bucket. Without validation, an instructor
// could paste `javascript:...`, a 50KB blob, an http: URL, or a path
// outside the expected bucket. Restrict to either:
//   1. a relative bucket path under `course-videos/` (or other approved
//      buckets), OR
//   2. an https:// URL on an approved external host (Vimeo / YouTube).
const ALLOWED_BUCKET_PREFIXES = ["course-videos/", "lesson-videos/"];
const ALLOWED_EXTERNAL_HOSTS = new Set([
  "player.vimeo.com",
  "vimeo.com",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
]);

const videoUrlSchema = z.object({
  video_url: z
    .string()
    .trim()
    .min(1, "video_url is required")
    .max(2048)
    .refine(
      (val) => {
        // Reject anything starting with a non-http scheme (defends against
        // javascript:, data:, vbscript:, file:, etc.)
        if (/^[a-z][a-z0-9+.-]*:/i.test(val) && !val.startsWith("https://")) {
          return false;
        }
        if (ALLOWED_BUCKET_PREFIXES.some((p) => val.startsWith(p))) return true;
        if (val.startsWith("https://")) {
          try {
            const u = new URL(val);
            return ALLOWED_EXTERNAL_HOSTS.has(u.hostname);
          } catch {
            return false;
          }
        }
        return false;
      },
      {
        message:
          "video_url must be a course-videos/ bucket path or an https URL on an approved host (Vimeo/YouTube)",
      }
    ),
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
