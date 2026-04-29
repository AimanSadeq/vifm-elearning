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
 * Returns the webinar recording URL.
 *
 * - Free webinars: any authenticated user can watch.
 * - Paid webinars: requires the `webinars` plan feature (Quarterly / Annual /
 *   Lifetime), with super_admin bypassing the check.
 *
 * The URL lives in the `webinar_recordings` table whose RLS allows only
 * super_admin to SELECT. We use the service-role client here, which bypasses
 * RLS, AFTER confirming the access conditions above.
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

  // Confirm the parent webinar exists + is completed (cheap check on the
  // public-readable webinars table).
  const { data: webinar } = await supabaseAdmin
    .from("webinars")
    .select("id, status, is_free")
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

  // Free webinars only require an authenticated user. Paid webinars still
  // require the `webinars` plan feature; super_admin bypasses both.
  if (!webinar.is_free && !isSuperAdmin(user)) {
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
