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

  // Look up enrollment for traceability (optional FK).
  const { data: enrollment } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

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
