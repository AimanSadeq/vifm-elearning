import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getCourseSurveyForLearner,
  upsertResponse,
  validateAnswers,
} from "@/lib/services/survey-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Submit (or edit) a survey response. UPSERT — first submit creates,
 * subsequent calls update in place and increment edit_count.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json(
      { error: "answers object is required" },
      { status: 400 }
    );
  }

  const result = await getCourseSurveyForLearner(user.id, courseId);
  if (!result)
    return NextResponse.json(
      { error: "Survey not found or inactive" },
      { status: 404 }
    );

  const validationError = validateAnswers(result.questions, body.answers);
  if (validationError)
    return NextResponse.json({ error: validationError }, { status: 400 });

  // Enrollment gate — only learners who have actually completed the
  // course can submit. Mirrors the modal's behaviour on the lesson
  // player (which only auto-opens at 100% completion) and prevents
  // anyone from POSTing early to unlock the cert/badge gate before
  // they've finished the work. Super admins bypass so they can use
  // the admin Preview button to test end-to-end.
  const isAdmin = user.app_metadata?.role === "super_admin";
  const { data: enrollment } = await supabaseAdmin
    .from("enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!isAdmin) {
    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }
    if (enrollment.status !== "completed") {
      return NextResponse.json(
        {
          error: "Complete the course before submitting the survey",
          code: "COURSE_NOT_COMPLETED",
        },
        { status: 403 }
      );
    }
  }

  const upsert = await upsertResponse({
    surveyId: result.survey.id,
    userId: user.id,
    enrollmentId: enrollment?.id ?? null,
    answers: body.answers,
  });

  if (!upsert.ok)
    return NextResponse.json({ error: upsert.error }, { status: 500 });

  return NextResponse.json({ data: upsert.data });
}
