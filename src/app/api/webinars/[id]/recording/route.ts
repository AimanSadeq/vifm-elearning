import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { userHasFeature } from "@/lib/services/access";
import { isSuperAdmin } from "@/lib/services/role";
import { createCourseVideoSignedUrl } from "@/lib/supabase/video-storage";

// Long enough to outlast a single watch session including pauses and dinner
// breaks. The <video> tag never re-fetches its source mid-playback, so a TTL
// shorter than the realistic watch window causes "SignatureExpired" errors
// with no recovery path. Six hours is a forgiving balance.
const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Returns the webinar recording URL — but only to users whose active
 * subscription grants the `webinars` feature (Quarterly / Annual / Lifetime).
 *
 * The URL lives in the `webinar_recordings` table whose RLS allows only
 * super_admin to SELECT. We use the service-role client here, which bypasses
 * RLS, AFTER confirming feature access via the user's plan.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json(
      { error: "Sign in to access recordings" },
      { status: 401 }
    );

  // Recording URL is data egress: only super_admin gets the role bypass.
  // Instructors aren't admins of this resource, even if they teach courses.
  if (!isSuperAdmin(user)) {
    const allowed = await userHasFeature(user.id, "webinars");
    if (!allowed)
      return NextResponse.json(
        {
          error:
            "Recording access is included with Quarterly, Annual, and Lifetime plans",
        },
        { status: 403 }
      );
  }

  // Confirm the parent webinar exists + is completed (cheap check on the
  // public-readable webinars table).
  const { data: webinar } = await supabaseAdmin
    .from("webinars")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!webinar)
    return NextResponse.json(
      { error: "Webinar not found" },
      { status: 404 }
    );

  if (webinar.status !== "completed")
    return NextResponse.json(
      { error: "Recording is not available yet" },
      { status: 404 }
    );

  // Fetch the URL from the locked-down recordings table via service role
  const { data: recording } = await supabaseAdmin
    .from("webinar_recordings")
    .select("url")
    .eq("webinar_id", id)
    .maybeSingle();

  if (!recording?.url)
    return NextResponse.json(
      { error: "Recording is not available yet" },
      { status: 404 }
    );

  // The stored value is either a Storage path (when uploaded through the
  // admin panel) or a full external URL (legacy/manual entries via SQL).
  // Treat anything starting with http(s):// as already-signed; otherwise
  // mint a short-lived signed URL against the course-videos bucket.
  const isAbsoluteUrl = /^https?:\/\//i.test(recording.url);
  if (isAbsoluteUrl) {
    return NextResponse.json({ data: { url: recording.url } });
  }

  const { url, error } = await createCourseVideoSignedUrl(
    recording.url,
    SIGNED_URL_TTL_SECONDS
  );
  if (error || !url) {
    console.error("[recording] sign error:", error);
    return NextResponse.json(
      { error: "Recording is temporarily unavailable" },
      { status: 500 }
    );
  }
  return NextResponse.json({ data: { url } });
}
