import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendTrainingFollowupEmail,
  sendTrainingImpactEmail,
} from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * Daily cron: post-training survey invitations, in two waves.
 *
 *   followup (Kirkpatrick L3) : ~90 days after a course training-assignment
 *                               completes, stamped via followup_sent_at
 *   impact   (Kirkpatrick L4) : ~180 days after, stamped via impact_sent_at
 *
 * For each wave: assignments completed >= delay days ago whose course has an
 * ACTIVE survey of that kind and no invitation sent yet get an email + in-app
 * notification linking to /my-training (where the learner answers), then the
 * stamp column is set so the wave never re-sends.
 *
 * Learning-path assignments are skipped in v1 — surveys are per course.
 *
 * Auth: CRON_SECRET header (x-cron-secret). `?dry=1` previews without
 * sending or writing. `?days=N` / `?impactDays=N` override the delays
 * (testing).
 */

const FOLLOWUP_DELAY_DAYS = 90;
const IMPACT_DELAY_DAYS = 180;

function verifyCronSecret(header: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type ProfileRef = {
  full_name: string | null;
  email: string | null;
  language: string | null;
} | null;
type CourseRef = { title: string | null; title_ar: string | null } | null;
const pickOne = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

interface WaveConfig {
  kind: "followup" | "impact";
  delayDays: number;
  stampColumn: "followup_sent_at" | "impact_sent_at";
  sendEmail: (params: {
    to: string;
    userName: string;
    trainingTitle: string;
    surveyUrl: string;
  }) => Promise<unknown>;
  notification: {
    title: string;
    title_ar: string;
    body: (title: string) => string;
    body_ar: (title: string) => string;
  };
}

interface WaveResults {
  invited: number;
  skippedNoSurvey: number;
  errors: number;
}

async function runWave(
  wave: WaveConfig,
  now: Date,
  dryRun: boolean,
): Promise<WaveResults> {
  const cutoff = new Date(now.getTime() - wave.delayDays * 24 * 60 * 60 * 1000);
  const results: WaveResults = { invited: 0, skippedNoSurvey: 0, errors: 0 };

  const { data: due, error: dueErr } = await supabaseAdmin
    .from("training_assignments")
    .select(
      `id, user_id, course_id, completed_at,
       user:profiles!training_assignments_user_id_fkey(full_name, email, language),
       course:courses(title, title_ar)`,
    )
    .eq("status", "completed")
    .not("course_id", "is", null)
    .is(wave.stampColumn, null)
    .lte("completed_at", cutoff.toISOString());

  if (dueErr) {
    console.error(
      `training-followups: failed to load assignments (${wave.kind})`,
      dueErr,
    );
    results.errors++;
    return results;
  }
  const assignments = due ?? [];
  if (assignments.length === 0) return results;

  // Which of these courses actually have an active survey of this kind?
  const courseIds = [...new Set(assignments.map((a) => a.course_id as string))];
  const { data: surveys } = await supabaseAdmin
    .from("course_surveys")
    .select("course_id")
    .eq("survey_kind", wave.kind)
    .eq("is_active", true)
    .in("course_id", courseIds);
  const hasSurvey = new Set((surveys ?? []).map((s) => s.course_id));

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";

  for (const a of assignments) {
    if (!hasSurvey.has(a.course_id)) {
      results.skippedNoSurvey++;
      continue;
    }
    const profile = pickOne(a.user as ProfileRef | ProfileRef[]);
    if (!profile?.email) {
      results.errors++;
      continue;
    }
    const course = pickOne(a.course as CourseRef | CourseRef[]);
    const title = course?.title ?? course?.title_ar ?? "your training";
    const locale = profile.language === "ar" ? "ar" : "en";
    const surveyPath = `/${locale}/my-training`;

    if (dryRun) {
      results.invited++;
      continue;
    }

    try {
      await wave.sendEmail({
        to: profile.email,
        userName: profile.full_name ?? profile.email,
        trainingTitle: title,
        surveyUrl: `${appUrl}${surveyPath}`,
      });

      await supabaseAdmin.from("notifications").insert({
        user_id: a.user_id,
        title: wave.notification.title,
        title_ar: wave.notification.title_ar,
        body: wave.notification.body(title),
        body_ar: wave.notification.body_ar(title),
        channel: "in_app",
        action_url: surveyPath,
      });

      await supabaseAdmin
        .from("training_assignments")
        .update({ [wave.stampColumn]: now.toISOString() })
        .eq("id", a.id);

      results.invited++;
    } catch (e) {
      console.error(
        `training-followups: send failed for assignment ${a.id} (${wave.kind})`,
        e,
      );
      results.errors++;
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const daysParam = Number(req.nextUrl.searchParams.get("days"));
  const impactDaysParam = Number(req.nextUrl.searchParams.get("impactDays"));
  const followupDelay =
    Number.isFinite(daysParam) && daysParam > 0
      ? daysParam
      : FOLLOWUP_DELAY_DAYS;
  const impactDelay =
    Number.isFinite(impactDaysParam) && impactDaysParam > 0
      ? impactDaysParam
      : IMPACT_DELAY_DAYS;

  const now = new Date();

  const waves: WaveConfig[] = [
    {
      kind: "followup",
      delayDays: followupDelay,
      stampColumn: "followup_sent_at",
      sendEmail: sendTrainingFollowupEmail,
      notification: {
        title: "Follow-up survey",
        title_ar: "استبيان المتابعة",
        body: (title) =>
          `How have you applied "${title}" in your work? Take the 2-minute follow-up survey.`,
        body_ar: (title) =>
          `كيف طبقت "${title}" في عملك؟ شارك في استبيان المتابعة (دقيقتان).`,
      },
    },
    {
      kind: "impact",
      delayDays: impactDelay,
      stampColumn: "impact_sent_at",
      sendEmail: sendTrainingImpactEmail,
      notification: {
        title: "Impact survey",
        title_ar: "استبيان الأثر",
        body: (title) =>
          `What results has "${title}" produced for you and your organization? Take the 2-minute impact survey.`,
        body_ar: (title) =>
          `ما النتائج التي حققها "${title}" لك ولمؤسستك؟ شارك في استبيان الأثر (دقيقتان).`,
      },
    },
  ];

  try {
    const [followup, impact] = [
      await runWave(waves[0], now, dryRun),
      await runWave(waves[1], now, dryRun),
    ];

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dryRun,
      // Kept flat for backwards compatibility with existing monitoring.
      invited: followup.invited,
      skippedNoSurvey: followup.skippedNoSurvey,
      errors: followup.errors + impact.errors,
      followup,
      impact,
    });
  } catch (err) {
    console.error("Training followups cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
