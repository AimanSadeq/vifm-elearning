import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  isBadgesEnabled,
  issueMissingBadges,
  getDelegateBadges,
} from "@/lib/services/badges-client";
import { hasCompletedRequiredSurvey } from "@/lib/services/survey-service";
import { syncLearnerProgress } from "@/lib/services/progress-service";

interface BadgeCourseRef {
  template_external_id?: string;
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

    // Recompute progress first so courses that are 100% but whose enrollment
    // status wasn't flipped to 'completed' yet are counted by the badge
    // self-heal below (which filters on status = 'completed').
    await syncLearnerProgress(user.id).catch(() => {});

    // Self-heal: issue badges for completed courses that have a badge attached
    // but never got one (e.g. badge enabled after the course was completed).
    let selfHeal: Awaited<ReturnType<typeof issueMissingBadges>> = [];
    let selfHealThrew: string | null = null;
    try {
      selfHeal = await issueMissingBadges(user.id);
    } catch (e) {
      selfHealThrew = e instanceof Error ? e.message : String(e);
      console.error("[badges] self-heal threw", e);
    }
    const healErrors = selfHeal.filter((r) => !r.ok);

    // Match by external_id OR email — the badges service keys delegates by
    // email, so the current account's badges may sit under a different
    // external_id for the same email.
    const { badges, via, scanned } = await getDelegateBadges(
      user.id,
      user.email,
    );

    // Survey gate — hide a badge only when its source course has an unsubmitted
    // required survey. The course is encoded on the badge as
    // `template_external_id = "course:{courseId}"`. Badges without that shape
    // are kept (never hide a valid badge we can't map to a course).
    const filtered: typeof badges = [];
    for (const b of badges) {
      const ext = (b as BadgeCourseRef).template_external_id;
      const courseId = ext?.startsWith("course:")
        ? ext.slice("course:".length)
        : null;
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
              // Completed courses on THIS account that have a badge attached.
              // 0 => the courses you finished don't have "Issue badge on
              // completion" enabled (enable it per course in the editor).
              completedBadgeCourses: selfHeal.length,
              selfHealOk: selfHeal.filter((r) => r.ok).length,
              selfHealErrors: healErrors,
              selfHealThrew,
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
