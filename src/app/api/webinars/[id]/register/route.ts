import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { registerZoomAttendee } from "@/lib/services/zoom";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await applyRateLimit(request, {
    scope: "webinars:register",
    buckets: [
      { limit: 5, windowMs: 60_000 },
      { limit: 30, windowMs: 60 * 60_000 },
    ],
  });
  if (limited) return limited;

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webinarId = id;

  // Check if webinar exists
  const { data: webinar } = await supabase
    .from("webinars")
    .select("id, meeting_id, title, status")
    .eq("id", webinarId)
    .single();

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (webinar.status === "cancelled") {
    return NextResponse.json({ error: "Webinar is cancelled" }, { status: 400 });
  }

  // Check if already registered. maybeSingle — single() returns 406 on 0 rows.
  const { data: existing } = await supabase
    .from("webinar_registrations")
    .select("id")
    .eq("webinar_id", webinarId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Already registered" }, { status: 200 });
  }

  // Register in Zoom (stub)
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  if (profile && webinar.meeting_id) {
    await registerZoomAttendee({
      meetingId: webinar.meeting_id,
      email: profile.email,
      name: profile.full_name,
    });
  }

  // Insert registration
  const { error } = await supabase.from("webinar_registrations").insert({
    webinar_id: webinarId,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Registered successfully" }, { status: 201 });
}
