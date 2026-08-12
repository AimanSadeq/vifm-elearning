import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  CourseSurvey,
  SurveyAggregate,
  SurveyAnswers,
  SurveyKind,
  SurveyQuestion,
  SurveyResponse,
} from "@/types/survey";

/**
 * Cert/badge gate. Returns true if the course either has no survey,
 * the survey is inactive or non-required, OR the user has already
 * submitted a response. Returns false ONLY when there is an active,
 * required survey and the user has not submitted.
 *
 * Always uses the admin client because callers are server-side and
 * we need to bypass RLS to check responses for arbitrary user IDs.
 */
export async function hasCompletedRequiredSurvey(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data: survey } = await supabaseAdmin
    .from("course_surveys")
    .select("id, is_required, is_active")
    .eq("course_id", courseId)
    .eq("survey_kind", "completion")
    .maybeSingle();

  if (!survey) return true;
  if (!survey.is_active) return true;
  if (!survey.is_required) return true;

  const { data: response } = await supabaseAdmin
    .from("survey_responses")
    .select("id")
    .eq("survey_id", survey.id)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(response);
}

export interface CourseSurveyStatus {
  hasSurvey: boolean;
  surveyId: string | null;
  isRequired: boolean;
  isActive: boolean;
  hasResponded: boolean;
  /** True when there's an active, required survey the user hasn't done. */
  blocking: boolean;
}

export async function getCourseSurveyStatus(
  userId: string,
  courseId: string,
): Promise<CourseSurveyStatus> {
  const { data: survey } = await supabaseAdmin
    .from("course_surveys")
    .select("id, is_required, is_active")
    .eq("course_id", courseId)
    .eq("survey_kind", "completion")
    .maybeSingle();

  if (!survey) {
    return {
      hasSurvey: false,
      surveyId: null,
      isRequired: false,
      isActive: false,
      hasResponded: false,
      blocking: false,
    };
  }

  let hasResponded = false;
  if (survey.is_active) {
    const { data: response } = await supabaseAdmin
      .from("survey_responses")
      .select("id")
      .eq("survey_id", survey.id)
      .eq("user_id", userId)
      .maybeSingle();
    hasResponded = Boolean(response);
  }

  return {
    hasSurvey: true,
    surveyId: survey.id,
    isRequired: survey.is_required,
    isActive: survey.is_active,
    hasResponded,
    blocking: survey.is_active && survey.is_required && !hasResponded,
  };
}

export interface SurveyWithQuestions {
  survey: CourseSurvey;
  questions: SurveyQuestion[];
  existingResponse: SurveyResponse | null;
}

export async function getCourseSurveyForLearner(
  userId: string,
  courseId: string,
  kind: SurveyKind = "completion",
): Promise<SurveyWithQuestions | null> {
  const { data: survey } = await supabaseAdmin
    .from("course_surveys")
    .select("*")
    .eq("course_id", courseId)
    .eq("survey_kind", kind)
    .eq("is_active", true)
    .maybeSingle();

  if (!survey) return null;

  const [{ data: questions }, { data: existingResponse }] = await Promise.all([
    supabaseAdmin
      .from("survey_questions")
      .select("*")
      .eq("survey_id", survey.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("survey_responses")
      .select("*")
      .eq("survey_id", survey.id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    survey: survey as CourseSurvey,
    questions: (questions as SurveyQuestion[]) ?? [],
    existingResponse: (existingResponse as SurveyResponse | null) ?? null,
  };
}

/**
 * Validate answers against required questions and shape per type.
 * Returns the first error message or null when valid.
 */
export function validateAnswers(
  questions: SurveyQuestion[],
  answers: SurveyAnswers,
): string | null {
  for (const q of questions) {
    const a = answers[q.id];
    const missing =
      a === undefined ||
      a === null ||
      a === "" ||
      (typeof a === "object" &&
        (a as { score?: unknown }).score === undefined);

    if (q.is_required && missing) {
      return `Answer required: ${q.question_text}`;
    }
    if (missing) continue;

    switch (q.question_type) {
      case "rating": {
        const n = Number(a);
        if (!Number.isInteger(n) || n < 1 || n > 5)
          return `Rating must be 1..5: ${q.question_text}`;
        break;
      }
      case "nps": {
        const score = (a as { score?: number }).score;
        if (!Number.isInteger(score) || score! < 0 || score! > 10)
          return `NPS must be 0..10: ${q.question_text}`;
        break;
      }
      case "multiple_choice": {
        if (typeof a !== "string" && typeof a !== "number")
          return `Invalid choice: ${q.question_text}`;
        break;
      }
      case "free_text": {
        if (typeof a !== "string")
          return `Invalid free text: ${q.question_text}`;
        if (a.length > 5000)
          return `Answer too long (max 5000 chars): ${q.question_text}`;
        break;
      }
    }
  }
  return null;
}

export async function upsertResponse(opts: {
  surveyId: string;
  userId: string;
  enrollmentId?: string | null;
  answers: SurveyAnswers;
}): Promise<{ ok: true; data: SurveyResponse } | { ok: false; error: string }> {
  // Existence check to decide INSERT vs UPDATE (so we can increment
  // edit_count and preserve the original submitted_at).
  const { data: existing } = await supabaseAdmin
    .from("survey_responses")
    .select("id, edit_count")
    .eq("survey_id", opts.surveyId)
    .eq("user_id", opts.userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("survey_responses")
      .update({
        answers: opts.answers,
        edit_count: (existing.edit_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as SurveyResponse };
  }

  const { data, error } = await supabaseAdmin
    .from("survey_responses")
    .insert({
      survey_id: opts.surveyId,
      user_id: opts.userId,
      enrollment_id: opts.enrollmentId ?? null,
      answers: opts.answers,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SurveyResponse };
}

/**
 * Per-question aggregates for the admin analytics page. Pulls all
 * responses for the survey, then computes stats client-side because
 * the dataset is small (one row per enrolled learner per course).
 */
export async function aggregateResponses(
  surveyId: string,
): Promise<{ questions: SurveyQuestion[]; aggregates: SurveyAggregate[] }> {
  const [{ data: questions }, { data: responses }] = await Promise.all([
    supabaseAdmin
      .from("survey_questions")
      .select("*")
      .eq("survey_id", surveyId)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("survey_responses")
      .select("answers")
      .eq("survey_id", surveyId),
  ]);

  const qs = (questions as SurveyQuestion[]) ?? [];
  const rs = (responses as { answers: SurveyAnswers }[]) ?? [];

  const aggregates: SurveyAggregate[] = qs.map((q) => {
    const values = rs
      .map((r) => r.answers?.[q.id])
      .filter((v) => v !== undefined && v !== null && v !== "");

    const agg: SurveyAggregate = {
      questionId: q.id,
      questionType: q.question_type,
      responseCount: values.length,
    };

    if (q.question_type === "rating") {
      const nums = values
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
      if (nums.length)
        agg.average = nums.reduce((s, n) => s + n, 0) / nums.length;
    } else if (q.question_type === "nps") {
      const scores = values
        .map((v) => (v as { score?: number }).score)
        .filter((s): s is number => Number.isFinite(s));
      if (scores.length) {
        agg.average = scores.reduce((s, n) => s + n, 0) / scores.length;
        const promoters = scores.filter((s) => s >= 9).length;
        const detractors = scores.filter((s) => s <= 6).length;
        agg.npsScore = Math.round(
          ((promoters - detractors) / scores.length) * 100,
        );
      }
    } else if (q.question_type === "multiple_choice") {
      const dist: Record<string, number> = {};
      for (const v of values) {
        const key = String(v);
        dist[key] = (dist[key] ?? 0) + 1;
      }
      agg.distribution = dist;
    } else if (q.question_type === "free_text") {
      agg.sampleResponses = values
        .map((v) => String(v))
        .filter((s) => s.trim().length > 0)
        .slice(0, 200);
    }

    return agg;
  });

  return { questions: qs, aggregates };
}
