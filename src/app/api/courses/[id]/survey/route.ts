import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCourseSurveyForLearner } from "@/lib/services/survey-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const kind =
    req.nextUrl.searchParams.get("kind") === "followup"
      ? ("followup" as const)
      : ("completion" as const);
  const result = await getCourseSurveyForLearner(user.id, courseId, kind);
  if (!result) return NextResponse.json({ data: null });

  return NextResponse.json({
    data: {
      survey: result.survey,
      questions: result.questions,
      existingResponse: result.existingResponse,
    },
  });
}
