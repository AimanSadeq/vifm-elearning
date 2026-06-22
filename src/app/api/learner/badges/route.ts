import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  badgesClient,
  isBadgesEnabled,
  issueMissingBadges,
} from "@/lib/services/badges-client";
import { hasCompletedRequiredSurvey } from "@/lib/services/survey-service";

interface IssuedBadgeWithExternal {
  external_id?: string;
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isBadgesEnabled()) {
      return NextResponse.json({ data: [], enabled: false });
    }

    // Self-heal: issue badges for completed courses that have a badge attached
    // but never got one (e.g. badge enabled after the course was completed).
    await issueMissingBadges(user.id).catch(() => {});

    const result = await badgesClient.listBadgesForDelegate(user.id);
    if (!result.ok) {
      // External service down — degrade silently so the profile page
      // still loads. Surface the error so the UI can show a banner.
      return NextResponse.json({ data: [], enabled: true, error: result.error });
    }

    const badges = result.data?.data ?? [];

    // Survey gate — filter out badges for courses with an unsubmitted
    // required survey. We encode the source course in external_id as
    // `${courseId}:${userId}` (see issueCourseBadge), so we can recover
    // the courseId from the badge without an extra round-trip.
    const filtered: typeof badges = [];
    for (const b of badges) {
      const ext = (b as IssuedBadgeWithExternal).external_id;
      const courseId = ext?.split(":")[0];
      if (!courseId) {
        filtered.push(b);
        continue;
      }
      const ok = await hasCompletedRequiredSurvey(user.id, courseId);
      if (ok) filtered.push(b);
    }

    return NextResponse.json({ data: filtered, enabled: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
