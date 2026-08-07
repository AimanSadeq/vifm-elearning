import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Course-wide knowledge check reporting and the certificate gate built on it.
 *
 * Every published quiz in a course is a "knowledge check". A learner's result
 * for a check is their BEST attempt. The course-level result is the
 * points-weighted aggregate of those best attempts, measured against
 * `courses.passing_score`.
 *
 * The gate mirrors the survey gate in `survey-service`: it only ever blocks
 * when the course opts in (`courses.require_knowledge_checks`) AND the course
 * actually has published checks. Courses without checks are unaffected.
 */

export interface KnowledgeCheckResult {
  quizId: string;
  lessonId: string | null;
  title: string;
  titleAr: string | null;
  isFinalExam: boolean;
  /** Per-quiz pass mark, percent. */
  passingScore: number;
  maxAttempts: number | null;
  attemptCount: number;
  attempted: boolean;
  /** Percent of the best attempt, or null when never attempted. */
  bestPercentage: number | null;
  /** Points earned on the best attempt, counted toward the course aggregate. */
  pointsEarned: number;
  /** Total points available, from the question set (not the attempt). */
  pointsAvailable: number;
  passed: boolean;
  lastAttemptAt: string | null;
}

export interface CourseKnowledgeCheckSummary {
  courseId: string;
  /** Course-level pass mark for the aggregate, percent. */
  requiredScore: number;
  checks: KnowledgeCheckResult[];
  totalChecks: number;
  attemptedChecks: number;
  passedChecks: number;
  pointsEarned: number;
  pointsAvailable: number;
  /** Weighted aggregate across all checks, or null when there are none. */
  overallPercentage: number | null;
  allAttempted: boolean;
  /** True when this course gates its certificate on knowledge checks. */
  gateActive: boolean;
  /** True when the learner satisfies the gate (always true when inactive). */
  meetsRequirement: boolean;
  /** Why the gate is unmet — for the learner-facing message. */
  reason: "ok" | "not_all_attempted" | "below_required_score";
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? parseFloat(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

export async function getCourseKnowledgeCheckSummary(
  userId: string,
  courseId: string
): Promise<CourseKnowledgeCheckSummary> {
  const [{ data: course }, { data: quizzes }] = await Promise.all([
    supabaseAdmin
      .from("courses")
      .select("passing_score, require_knowledge_checks")
      .eq("id", courseId)
      .maybeSingle(),
    supabaseAdmin
      .from("quizzes")
      .select(
        "id, lesson_id, title, title_ar, is_final_exam, passing_score, max_attempts, sort_order"
      )
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  const requiredScore = toNumber(course?.passing_score, 0);
  const quizRows = quizzes ?? [];

  if (quizRows.length === 0) {
    return {
      courseId,
      requiredScore,
      checks: [],
      totalChecks: 0,
      attemptedChecks: 0,
      passedChecks: 0,
      pointsEarned: 0,
      pointsAvailable: 0,
      overallPercentage: null,
      allAttempted: true,
      gateActive: false,
      meetsRequirement: true,
      reason: "ok",
    };
  }

  const quizIds = quizRows.map((q) => q.id);

  const [{ data: questions }, { data: attempts }] = await Promise.all([
    supabaseAdmin
      .from("quiz_questions")
      .select("quiz_id, points")
      .in("quiz_id", quizIds),
    // Every completed attempt; the best one per quiz is picked below. An
    // in-flight attempt has no completed_at and must not count.
    supabaseAdmin
      .from("quiz_attempts")
      .select("quiz_id, score, total_points, percentage, passed, completed_at")
      .eq("user_id", userId)
      .in("quiz_id", quizIds)
      .not("completed_at", "is", null),
  ]);

  const availableByQuiz = new Map<string, number>();
  for (const q of questions ?? []) {
    availableByQuiz.set(
      q.quiz_id,
      (availableByQuiz.get(q.quiz_id) ?? 0) + toNumber(q.points, 0)
    );
  }

  type AttemptRow = {
    quiz_id: string;
    score: number | string | null;
    /** Points available at the time the attempt was scored. */
    total_points: number | string | null;
    percentage: number | string | null;
    passed: boolean | null;
    completed_at: string | null;
  };

  const attemptsByQuiz = new Map<string, AttemptRow[]>();
  for (const a of (attempts ?? []) as AttemptRow[]) {
    const list = attemptsByQuiz.get(a.quiz_id) ?? [];
    list.push(a);
    attemptsByQuiz.set(a.quiz_id, list);
  }

  const checks: KnowledgeCheckResult[] = quizRows.map((quiz) => {
    const quizAttempts = attemptsByQuiz.get(quiz.id) ?? [];
    // "Best" is the highest percentage; ties break to the most recent so the
    // learner sees the attempt they'd expect.
    const best = quizAttempts.reduce<AttemptRow | null>((acc, a) => {
      if (!acc) return a;
      const accPct = toNumber(acc.percentage, -1);
      const aPct = toNumber(a.percentage, -1);
      if (aPct > accPct) return a;
      if (aPct === accPct && (a.completed_at ?? "") > (acc.completed_at ?? ""))
        return a;
      return acc;
    }, null);

    // The question set is the authoritative denominator: it stays correct even
    // if questions were added after an older attempt was scored.
    const pointsAvailable =
      availableByQuiz.get(quiz.id) ?? toNumber(best?.total_points, 0);

    const lastAttemptAt = quizAttempts.reduce<string | null>(
      (latest, a) =>
        !latest || (a.completed_at ?? "") > latest ? a.completed_at : latest,
      null
    );

    // Rescale the earned points onto the current question set so a stale
    // total_points cannot inflate the aggregate above 100%.
    const bestPercentage = best ? toNumber(best.percentage, 0) : null;
    const pointsEarned =
      bestPercentage === null
        ? 0
        : Math.min(pointsAvailable, (bestPercentage / 100) * pointsAvailable);

    return {
      quizId: quiz.id,
      lessonId: quiz.lesson_id ?? null,
      title: quiz.title,
      titleAr: quiz.title_ar ?? null,
      isFinalExam: Boolean(quiz.is_final_exam),
      passingScore: toNumber(quiz.passing_score, 70),
      maxAttempts: quiz.max_attempts ?? null,
      attemptCount: quizAttempts.length,
      attempted: quizAttempts.length > 0,
      bestPercentage,
      pointsEarned,
      pointsAvailable,
      passed: Boolean(best?.passed),
      lastAttemptAt,
    };
  });

  const pointsEarned = checks.reduce((s, c) => s + c.pointsEarned, 0);
  const pointsAvailable = checks.reduce((s, c) => s + c.pointsAvailable, 0);
  const overallPercentage =
    pointsAvailable > 0
      ? Math.round((pointsEarned / pointsAvailable) * 1000) / 10
      : null;

  const attemptedChecks = checks.filter((c) => c.attempted).length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const allAttempted = attemptedChecks === checks.length;

  const gateActive = Boolean(course?.require_knowledge_checks);
  let reason: CourseKnowledgeCheckSummary["reason"] = "ok";
  if (!allAttempted) reason = "not_all_attempted";
  else if ((overallPercentage ?? 0) < requiredScore)
    reason = "below_required_score";

  return {
    courseId,
    requiredScore,
    checks,
    totalChecks: checks.length,
    attemptedChecks,
    passedChecks,
    pointsEarned: Math.round(pointsEarned * 100) / 100,
    pointsAvailable,
    overallPercentage,
    allAttempted,
    gateActive,
    meetsRequirement: !gateActive || reason === "ok",
    reason: gateActive ? reason : "ok",
  };
}

/**
 * Certificate gate. True when the course does not gate on knowledge checks,
 * or the learner has attempted every check and cleared the course pass mark.
 */
export async function meetsKnowledgeCheckRequirement(
  userId: string,
  courseId: string
): Promise<boolean> {
  const summary = await getCourseKnowledgeCheckSummary(userId, courseId);
  return summary.meetsRequirement;
}
