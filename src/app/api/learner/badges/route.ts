import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  isBadgesEnabled,
  issueMissingBadges,
  getDelegateBadges,
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
    const selfHeal = await issueMissingBadges(user.id).catch(() => []);
    const healErrors = selfHeal.filter((r) => !r.ok);

    const { badges, via, scanned } = await getDelegateBadges(user.id);

    // Survey gate — hide a badge only when its course has an unsubmitted
    // required survey. We encode the source course in external_id as
    // `${courseId}:${userId}` (see issueCourseBadge). Only apply the gate when
    // the badge actually carries that exact shape; any other id is kept, so we
    // never accidentally hide a valid badge whose id we can't parse.
    const filtered: typeof badges = [];
    for (const b of badges) {
      const ext = (b as IssuedBadgeWithExternal).external_id;
      const parts = ext?.split(":");
      const courseId =
        parts && parts.length === 2 && parts[1] === user.id ? parts[0] : null;
      if (!courseId) {
        filtered.push(b);
        continue;
      }
      const ok = await hasCompletedRequiredSurvey(user.id, courseId);
      if (ok) filtered.push(b);
    }

    return NextResponse.json({
      data: filtered,
      enabled: true,
      ...(filtered.length === 0
        ? {
            debug: {
              delegateId: user.id,
              via,
              scanned,
              rawCount: badges.length,
              // How many completed courses with a badge attached THIS account
              // has. 0 => this account hasn't completed a badge course (likely
              // the completion happened on a different account).
              completedBadgeCourses: selfHeal.length,
              selfHealOk: selfHeal.filter((r) => r.ok).length,
              externalIds: badges
                .slice(0, 5)
                .map((b) => (b as IssuedBadgeWithExternal).external_id ?? null),
            },
          }
        : {}),
      ...(healErrors.length ? { issueDebug: healErrors } : {}),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
