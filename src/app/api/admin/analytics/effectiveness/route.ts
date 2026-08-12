import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SurveyAnswers } from "@/types/survey";

/**
 * Training effectiveness (Kirkpatrick) rollup for admin analytics.
 *
 * For every course that has a follow-up survey, compares Level 1
 * (completion-survey reaction) against Level 3 (follow-up applied-behavior)
 * ratings, alongside invitation/response funnel numbers from the
 * training-followups cron, plus a 12-month trend of follow-up responses.
 */

interface SurveyScore {
  responses: number;
  avgRating: number | null;
  nps: number | null;
}

interface QuestionRef {
  id: string;
  survey_id: string;
  question_type: string;
}

interface ResponseRef {
  survey_id: string;
  answers: SurveyAnswers;
  submitted_at: string;
}

function scoreSurvey(
  surveyId: string | null,
  questions: QuestionRef[],
  responses: ResponseRef[],
): SurveyScore {
  if (!surveyId) return { responses: 0, avgRating: null, nps: null };
  const own = responses.filter((r) => r.survey_id === surveyId);
  const ratingQs = questions.filter(
    (q) => q.survey_id === surveyId && q.question_type === "rating",
  );
  const npsQs = questions.filter(
    (q) => q.survey_id === surveyId && q.question_type === "nps",
  );

  const ratings: number[] = [];
  for (const r of own) {
    for (const q of ratingQs) {
      const n = Number(r.answers?.[q.id]);
      if (Number.isFinite(n)) ratings.push(n);
    }
  }

  const npsScores: number[] = [];
  for (const r of own) {
    for (const q of npsQs) {
      const v = r.answers?.[q.id] as { score?: number } | undefined;
      if (v && Number.isFinite(v.score)) npsScores.push(v.score as number);
    }
  }

  let nps: number | null = null;
  if (npsScores.length) {
    const promoters = npsScores.filter((s) => s >= 9).length;
    const detractors = npsScores.filter((s) => s <= 6).length;
    nps = Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  return {
    responses: own.length,
    avgRating: ratings.length
      ? ratings.reduce((s, n) => s + n, 0) / ratings.length
      : null,
    nps,
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data: followups, error } = await supabaseAdmin
    .from("course_surveys")
    .select(
      "id, course_id, is_active, course:courses!course_surveys_course_id_fkey(title, title_ar)",
    )
    .eq("survey_kind", "followup");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!followups || followups.length === 0) {
    return NextResponse.json({
      totals: { invited: 0, responded: 0, responseRate: 0, avgFollowupRating: null },
      courses: [],
      monthly: [],
    });
  }

  const courseIds = followups.map((f) => f.course_id);

  const [{ data: completions }, { data: invitedRows }] = await Promise.all([
    supabaseAdmin
      .from("course_surveys")
      .select("id, course_id")
      .eq("survey_kind", "completion")
      .in("course_id", courseIds),
    supabaseAdmin
      .from("training_assignments")
      .select("course_id")
      .in("course_id", courseIds)
      .not("followup_sent_at", "is", null),
  ]);

  const completionByCourse = new Map(
    (completions ?? []).map((c) => [c.course_id, c.id]),
  );
  const invitedByCourse = new Map<string, number>();
  for (const r of invitedRows ?? []) {
    invitedByCourse.set(r.course_id, (invitedByCourse.get(r.course_id) ?? 0) + 1);
  }

  const surveyIds = [
    ...followups.map((f) => f.id),
    ...(completions ?? []).map((c) => c.id),
  ];

  const [{ data: questions }, { data: responses }] = await Promise.all([
    supabaseAdmin
      .from("survey_questions")
      .select("id, survey_id, question_type")
      .in("survey_id", surveyIds)
      .in("question_type", ["rating", "nps"]),
    supabaseAdmin
      .from("survey_responses")
      .select("survey_id, answers, submitted_at")
      .in("survey_id", surveyIds),
  ]);

  const qs = (questions ?? []) as QuestionRef[];
  const rs = (responses ?? []) as ResponseRef[];

  const pickOne = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  const courses = followups.map((f) => {
    type CourseRef = { title: string | null; title_ar: string | null };
    const course = pickOne(f.course as unknown as CourseRef | CourseRef[] | null);
    const invited = invitedByCourse.get(f.course_id) ?? 0;
    const followup = scoreSurvey(f.id, qs, rs);
    const completion = scoreSurvey(
      completionByCourse.get(f.course_id) ?? null,
      qs,
      rs,
    );
    return {
      courseId: f.course_id,
      title: course?.title ?? "—",
      titleAr: course?.title_ar ?? null,
      isActive: f.is_active,
      invited,
      responded: followup.responses,
      responseRate:
        invited > 0
          ? Math.min(100, Math.round((followup.responses / invited) * 100))
          : null,
      completion,
      followup,
    };
  });

  // 12-month trend of follow-up responses (count + avg rating per month).
  const followupIds = new Set(followups.map((f) => f.id));
  const followupRatingQs = qs.filter(
    (q) => followupIds.has(q.survey_id) && q.question_type === "rating",
  );
  const monthKey = (d: Date) =>
    d.toLocaleString("en-US", { month: "short", year: "2-digit" });
  const monthly = new Map<string, { responses: number; ratings: number[] }>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    monthly.set(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), {
      responses: 0,
      ratings: [],
    });
  }
  for (const r of rs) {
    if (!followupIds.has(r.survey_id)) continue;
    const entry = monthly.get(monthKey(new Date(r.submitted_at)));
    if (!entry) continue;
    entry.responses++;
    for (const q of followupRatingQs) {
      if (q.survey_id !== r.survey_id) continue;
      const n = Number(r.answers?.[q.id]);
      if (Number.isFinite(n)) entry.ratings.push(n);
    }
  }

  const totalInvited = courses.reduce((s, c) => s + c.invited, 0);
  const totalResponded = courses.reduce((s, c) => s + c.responded, 0);
  const allFollowupRatings = courses
    .map((c) => c.followup)
    .filter((f) => f.avgRating !== null);
  const avgFollowupRating = allFollowupRatings.length
    ? allFollowupRatings.reduce(
        (s, f) => s + (f.avgRating as number) * f.responses,
        0,
      ) / allFollowupRatings.reduce((s, f) => s + f.responses, 0)
    : null;

  return NextResponse.json({
    totals: {
      invited: totalInvited,
      responded: totalResponded,
      responseRate:
        totalInvited > 0
          ? Math.min(100, Math.round((totalResponded / totalInvited) * 100))
          : 0,
      avgFollowupRating,
    },
    courses,
    monthly: Array.from(monthly.entries()).map(([month, m]) => ({
      month,
      responses: m.responses,
      avgRating: m.ratings.length
        ? m.ratings.reduce((s, n) => s + n, 0) / m.ratings.length
        : null,
    })),
  });
}
