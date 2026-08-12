import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseSurveyKind, type SurveyKind } from "@/types/survey";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function surveyKind(req: NextRequest): SurveyKind {
  return parseSurveyKind(req.nextUrl.searchParams.get("kind"));
}

async function getSurveyId(
  courseId: string,
  kind: SurveyKind,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("course_surveys")
    .select("id")
    .eq("course_id", courseId)
    .eq("survey_kind", kind)
    .maybeSingle();
  return data?.id ?? null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;
  const surveyId = await getSurveyId(courseId, surveyKind(request));
  if (!surveyId)
    return NextResponse.json(
      { error: "Survey does not exist yet for this course" },
      { status: 400 }
    );

  const body = await request.json().catch(() => ({}));
  if (!body.question_text || !body.question_type) {
    return NextResponse.json(
      { error: "question_text and question_type are required" },
      { status: 400 }
    );
  }

  // Place new question at end.
  const { data: maxRow } = await supabaseAdmin
    .from("survey_questions")
    .select("sort_order")
    .eq("survey_id", surveyId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("survey_questions")
    .insert({
      survey_id: surveyId,
      question_text: body.question_text,
      question_text_ar: body.question_text_ar ?? null,
      question_type: body.question_type,
      options: body.options ?? null,
      is_required: body.is_required ?? true,
      sort_order: nextOrder,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Bulk reorder — body: { order: [questionId, ...] }
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;
  const surveyId = await getSurveyId(courseId, surveyKind(request));
  if (!surveyId)
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.order))
    return NextResponse.json(
      { error: "order: string[] is required" },
      { status: 400 }
    );

  await Promise.all(
    (body.order as string[]).map((qid, idx) =>
      supabaseAdmin
        .from("survey_questions")
        .update({ sort_order: idx })
        .eq("id", qid)
        .eq("survey_id", surveyId)
    )
  );

  return NextResponse.json({ success: true });
}
