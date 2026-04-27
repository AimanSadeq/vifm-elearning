import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin } from "@/lib/services/admin-auth";
import { sanitizeFileName } from "@/lib/supabase/video-storage";

const VIDEO_BUCKET = "course-videos";
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_MAX = 2 * 1024 * 1024 * 1024; // 2 GB — same as course-video uploads.

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UploadUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Issue a short-lived signed upload URL for a webinar recording. Files are
 * uploaded directly from the browser to Supabase Storage (no buffering through
 * Next.js). The resulting `path` should then be saved to
 * `webinar_recordings.url` via PUT /api/admin/webinars/[id]/recording.
 *
 * Bucket layout: course-videos/webinars/{webinarId}/{timestamp}-{filename}
 * Reusing the existing bucket avoids a separate Storage policy setup; the
 * webinar prefix keeps recordings logically separate from course videos.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: webinarId } = await params;

    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }
    if (auth.admin.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Confirm the webinar exists before issuing a signed URL — keeps storage
    // tidy if a stale tab tries to upload after the row was deleted.
    const { data: webinar } = await supabaseAdmin
      .from("webinars")
      .select("id")
      .eq("id", webinarId)
      .maybeSingle();
    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const body = (await request.json()) as UploadUrlRequest;
    const { fileName, fileSize, mimeType } = body;

    if (!fileName || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "fileName and fileSize are required" },
        { status: 400 }
      );
    }
    if (!VIDEO_MIMES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Only MP4, WebM, or MOV recordings are allowed" },
        { status: 400 }
      );
    }
    if (fileSize > VIDEO_MAX) {
      return NextResponse.json(
        { error: "Recording too large. Maximum size is 2 GB." },
        { status: 413 }
      );
    }

    const path = `webinars/${webinarId}/${Date.now()}-${sanitizeFileName(fileName)}`;

    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: `Failed to create upload URL: ${error?.message || "unknown"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bucket: VIDEO_BUCKET,
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  } catch (error) {
    console.error("[webinar upload-url] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
