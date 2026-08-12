import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SurveyAnswers } from "@/types/survey";

/**
 * Training effectiveness (Kirkpatrick) rollup for admin analytics.
 *
 * For every course that has a follow-up (L3) or impact (L4) survey, reports
 * the four Kirkpatrick levels side by side:
 *   L1 reaction  : completion-survey rating/NPS
 *   L2 learning  : best-attempt quiz scores
 *   L3 behavior  : follow-up survey rating/NPS + invitation funnel
 *   L4 results   : impact survey rating/NPS + invitation funnel
 * plus a 12-month trend of follow-up responses.
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

interface LearningScore {
  /** Mean of each learner's best attempt percentage per quiz (0-100). */
  avgScore: number | null;
  /** Share of learner-quiz pairs with at least one passed attempt (0-100). */
  passRate: number | null;
  learners: number;
}

/**
 * Level 2 (learning): best-attempt quiz scores per course, from completed
 * attempts on published quizzes. Attempts are paginated past the 1000-row cap.
 */
async function loadLearningScores(
  courseIds: string[],
): Promise<Map<string, LearningScore>> {
  const scores = new Map<string, LearningScore>();
  const { data: quizzes } = await supabaseAdmin
    .from("quizzes")
    .select("id, course_id")
    .eq("is_published", true)
    .in("course_id", courseIds);
  if (!quizzes || quizzes.length === 0) return scores;

  const quizCourse = new Map(quizzes.map((q) => [q.id, q.course_id]));
  const quizIds = quizzes.map((q) => q.id);

  type AttemptRow = {
    quiz_id: string;
    user_id: string;
    percentage: number | null;
    passed: boolean | null;
  };
  const attempts: AttemptRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data } = await supabaseAdmin
      .from("quiz_attempts")
      .select("quiz_id, user_id, percentage, passed")
      .in("quiz_id", quizIds)
      .not("completed_at", "is", null)
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    attempts.push(...(data as AttemptRow[]));
    if (data.length < pageSize) break;
  }

  // Best attempt per (quiz, user) pair.
  const best = new Map<string, { pct: number | null; passed: boolean }>();
  for (const a of attempts) {
    const key = `${a.quiz_id}:${a.user_id}`;
    const prev = best.get(key);
    const pct = a.percentage === null ? null : Number(a.percentage);
    best.set(key, {
      pct:
        prev?.pct === undefined || prev.pct === null
          ? pct
          : pct === null
            ? prev.pct
            : Math.max(prev.pct, pct),
      passed: (prev?.passed ?? false) || Boolean(a.passed),
    });
  }

  const perCourse = new Map<
    string,
    { pcts: number[]; passed: number; pairs: number; users: Set<string> }
  >();
  for (const [key, b] of best) {
    const [quizId, userId] = key.split(":");
    const courseId = quizCourse.get(quizId);
    if (!courseId) continue;
    let entry = perCourse.get(courseId);
    if (!entry) {
      entry = { pcts: [], passed: 0, pairs: 0, users: new Set() };
      perCourse.set(courseId, entry);
    }
    entry.pairs++;
    entry.users.add(userId);
    if (b.pct !== null && Number.isFinite(b.pct)) entry.pcts.push(b.pct);
    if (b.passed) entry.passed++;
  }

  for (const [courseId, e] of perCourse) {
    scores.set(courseId, {
      avgScore: e.pcts.length
        ? e.pcts.reduce((s, n) => s + n, 0) / e.pcts.length
        : null,
      passRate: e.pairs > 0 ? Math.round((e.passed / e.pairs) * 100) : null,
      learners: e.users.size,
    });
  }
  return scores;
}

async function countInvited(
  courseIds: string[],
  stampColumn: "followup_sent_at" | "impact_sent_at",
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (courseIds.length === 0) return map;
  const { data } = await supabaseAdmin
    .from("training_assignments")
    .select("course_id")
    .in("course_id", courseIds)
    .not(stampColumn, "is", null);
  for (const r of data ?? []) {
    map.set(r.course_id, (map.get(r.course_id) ?? 0) + 1);
  }
  return map;
}

const rate = (responded: number, invited: number): number | null =>
  invited > 0 ? Math.min(100, Math.round((responded / invited) * 100)) : null;

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  type CourseRef = { title: string | null; title_ar: string | null };
  const { data: surveyRows, error } = await supabaseAdmin
    .from("course_surveys")
    .select(
      "id, course_id, survey_kind, is_active, course:courses!course_surveys_course_id_fkey(title, title_ar)",
    )
    .in("survey_kind", ["followup", "impact"]);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!surveyRows || surveyRows.length === 0) {
    return NextResponse.json({
      totals: {
        invited: 0,
        responded: 0,
        responseRate: 0,
        avgLearningScore: null,
        avgFollowupRating: null,
      },
      courses: [],
      monthly: [],
    });
  }

  const pickOne = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  interface CourseEntry {
    course: CourseRef | null;
    followupId: string | null;
    impactId: string | null;
    isActive: boolean;
  }
  const byCourse = new Map<string, CourseEntry>();
  for (const row of surveyRows) {
    let entry = byCourse.get(row.course_id);
    if (!entry) {
      entry = {
        course: pickOne(row.course as unknown as CourseRef | CourseRef[] | null),
        followupId: null,
        impactId: null,
        isActive: false,
      };
      byCourse.set(row.course_id, entry);
    }
    if (row.survey_kind === "followup") entry.followupId = row.id;
    if (row.survey_kind === "impact") entry.impactId = row.id;
    entry.isActive = entry.isActive || Boolean(row.is_active);
  }
  const courseIds = [...byCourse.keys()];

  const [
    { data: completions },
    followupInvited,
    impactInvited,
    learningByCourse,
  ] = await Promise.all([
    supabaseAdmin
      .from("course_surveys")
      .select("id, course_id")
      .eq("survey_kind", "completion")
      .in("course_id", courseIds),
    countInvited(courseIds, "followup_sent_at"),
    countInvited(courseIds, "impact_sent_at"),
    loadLearningScores(courseIds),
  ]);

  const completionByCourse = new Map(
    (completions ?? []).map((c) => [c.course_id, c.id]),
  );

  const surveyIds = [
    ...surveyRows.map((s) => s.id),
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

  const courses = courseIds.map((courseId) => {
    const entry = byCourse.get(courseId) as CourseEntry;
    const invited = followupInvited.get(courseId) ?? 0;
    const followup = scoreSurvey(entry.followupId, qs, rs);
    const impact = scoreSurvey(entry.impactId, qs, rs);
    const completion = scoreSurvey(
      completionByCourse.get(courseId) ?? null,
      qs,
      rs,
    );
    const invitedImpact = impactInvited.get(courseId) ?? 0;
    return {
      courseId,
      title: entry.course?.title ?? "—",
      titleAr: entry.course?.title_ar ?? null,
      isActive: entry.isActive,
      invited,
      responded: followup.responses,
      responseRate: entry.followupId ? rate(followup.responses, invited) : null,
      completion,
      learning: learningByCourse.get(courseId) ?? {
        avgScore: null,
        passRate: null,
        learners: 0,
      },
      followup,
      impact,
      impactInvited: invitedImpact,
      impactResponseRate: entry.impactId
        ? rate(impact.responses, invitedImpact)
        : null,
    };
  });

  // 12-month trend of follow-up responses (count + avg rating per month).
  const followupIds = new Set(
    surveyRows.filter((s) => s.survey_kind === "followup").map((s) => s.id),
  );
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
    .filter((f) => f.avgRating !== null && f.responses > 0);
  const avgFollowupRating = allFollowupRatings.length
    ? allFollowupRatings.reduce(
        (s, f) => s + (f.avgRating as number) * f.responses,
        0,
      ) / allFollowupRatings.reduce((s, f) => s + f.responses, 0)
    : null;

  const learningRows = courses.filter((c) => c.learning.avgScore !== null);
  const learningWeight = learningRows.reduce(
    (s, c) => s + Math.max(1, c.learning.learners),
    0,
  );
  const avgLearningScore = learningRows.length
    ? learningRows.reduce(
        (s, c) =>
          s +
          (c.learning.avgScore as number) * Math.max(1, c.learning.learners),
        0,
      ) / learningWeight
    : null;

  return NextResponse.json({
    totals: {
      invited: totalInvited,
      responded: totalResponded,
      responseRate:
        totalInvited > 0
          ? Math.min(100, Math.round((totalResponded / totalInvited) * 100))
          : 0,
      avgLearningScore,
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
