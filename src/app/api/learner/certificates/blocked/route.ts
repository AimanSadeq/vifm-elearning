import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCourseSurveyStatus } from "@/lib/services/survey-service";
import { getCourseKnowledgeCheckSummary } from "@/lib/services/knowledge-check-service";

/**
 * Returns courses the learner has completed but where the certificate is
 * still blocked — by an unfinished required survey, or by outstanding
 * knowledge checks. Powers the "unlock your certificate" banner on the
 * certificates page.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: completedEnrollments } = await supabaseAdmin
    .from("enrollments")
    .select(
      "id, course_id, course:courses!enrollments_course_id_fkey(title, title_ar, slug)"
    )
    .eq("user_id", user.id)
    .eq("status", "completed");

  if (!completedEnrollments?.length) return NextResponse.json({ data: [] });

  type CourseRef = { title: string; title_ar: string | null; slug: string };
  const blocked: Array<{
    course_id: string;
    course: CourseRef;
    reason: "survey" | "knowledge_checks";
    /** Present when reason is knowledge_checks. */
    checksRemaining?: number;
    overallPercentage?: number | null;
    requiredScore?: number;
  }> = [];

  for (const e of completedEnrollments) {
    // Supabase types joined relations as either a single object or an array
    // depending on schema inference. Normalise here.
    const c = e.course as unknown as CourseRef | CourseRef[] | null;
    const course = Array.isArray(c) ? c[0] : c;
    if (!course) continue;

    const surveyStatus = await getCourseSurveyStatus(user.id, e.course_id);
    if (surveyStatus.blocking) {
      blocked.push({ course_id: e.course_id, course, reason: "survey" });
      continue;
    }

    const checks = await getCourseKnowledgeCheckSummary(user.id, e.course_id);
    if (!checks.meetsRequirement) {
      blocked.push({
        course_id: e.course_id,
        course,
        reason: "knowledge_checks",
        checksRemaining: checks.totalChecks - checks.attemptedChecks,
        overallPercentage: checks.overallPercentage,
        requiredScore: checks.requiredScore,
      });
    }
  }

  return NextResponse.json({ data: blocked });
}
