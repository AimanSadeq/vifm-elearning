import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendTrainingFollowupEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * Daily cron: Kirkpatrick Level 3 follow-up invitations.
 *
 * For course training-assignments completed >= FOLLOWUP_DELAY_DAYS ago whose
 * course has an ACTIVE followup survey and no invitation was sent yet, send
 * an email + in-app notification linking to /my-training (where the learner
 * answers the survey), then stamp followup_sent_at so it never re-sends.
 *
 * Learning-path assignments are skipped in v1 — follow-ups are per course.
 *
 * Auth: CRON_SECRET header (x-cron-secret). `?dry=1` previews without
 * sending or writing. `?days=N` overrides the delay (testing).
 */

const FOLLOWUP_DELAY_DAYS = 90;

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

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const daysParam = Number(req.nextUrl.searchParams.get("days"));
  const delayDays =
    Number.isFinite(daysParam) && daysParam > 0 ? daysParam : FOLLOWUP_DELAY_DAYS;

  const now = new Date();
  const cutoff = new Date(now.getTime() - delayDays * 24 * 60 * 60 * 1000);
  const results = { invited: 0, skippedNoSurvey: 0, errors: 0, dryRun };

  try {
    const { data: due, error: dueErr } = await supabaseAdmin
      .from("training_assignments")
      .select(
        `id, user_id, course_id, completed_at,
         user:profiles!training_assignments_user_id_fkey(full_name, email, language),
         course:courses(title, title_ar)`,
      )
      .eq("status", "completed")
      .not("course_id", "is", null)
      .is("followup_sent_at", null)
      .lte("completed_at", cutoff.toISOString());

    if (dueErr) {
      console.error("training-followups: failed to load assignments", dueErr);
      return NextResponse.json(
        { error: "Failed to load assignments" },
        { status: 500 },
      );
    }
    const assignments = due ?? [];
    if (assignments.length === 0) {
      return NextResponse.json({ success: true, timestamp: now.toISOString(), ...results });
    }

    // Which of these courses actually have an active follow-up survey?
    const courseIds = [
      ...new Set(assignments.map((a) => a.course_id as string)),
    ];
    const { data: surveys } = await supabaseAdmin
      .from("course_surveys")
      .select("course_id")
      .eq("survey_kind", "followup")
      .eq("is_active", true)
      .in("course_id", courseIds);
    const hasFollowup = new Set((surveys ?? []).map((s) => s.course_id));

    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";

    for (const a of assignments) {
      if (!hasFollowup.has(a.course_id)) {
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
        await sendTrainingFollowupEmail({
          to: profile.email,
          userName: profile.full_name ?? profile.email,
          trainingTitle: title,
          surveyUrl: `${appUrl}${surveyPath}`,
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: a.user_id,
          title: "Follow-up survey",
          title_ar: "استبيان المتابعة",
          body: `How have you applied "${title}" in your work? Take the 2-minute follow-up survey.`,
          body_ar: `كيف طبقت "${title}" في عملك؟ شارك في استبيان المتابعة (دقيقتان).`,
          channel: "in_app",
          action_url: surveyPath,
        });

        await supabaseAdmin
          .from("training_assignments")
          .update({ followup_sent_at: now.toISOString() })
          .eq("id", a.id);

        results.invited++;
      } catch (e) {
        console.error(`training-followups: send failed for assignment ${a.id}`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), ...results });
  } catch (err) {
    console.error("Training followups cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
