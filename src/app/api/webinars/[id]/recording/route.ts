import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { userHasFeature } from "@/lib/services/access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Returns the webinar recording URL — but only to users whose active
 * subscription grants the `webinars` feature (Quarterly / Annual / Lifetime).
 *
 * The `recording_url` column is NEVER sent to the client through the regular
 * webinar select; it lives only here, behind this gate.
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

  const isAdmin = user.app_metadata?.role === "super_admin";

  if (!isAdmin) {
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

  const { data: webinar } = await supabaseAdmin
    .from("webinars")
    .select("id, status, recording_url, is_recording_public")
    .eq("id", id)
    .maybeSingle();

  if (!webinar)
    return NextResponse.json(
      { error: "Webinar not found" },
      { status: 404 }
    );

  if (webinar.status !== "completed" || !webinar.recording_url)
    return NextResponse.json(
      { error: "Recording is not available yet" },
      { status: 404 }
    );

  return NextResponse.json({ data: { url: webinar.recording_url } });
}
