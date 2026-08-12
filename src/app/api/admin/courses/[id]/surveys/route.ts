import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseSurveyKind, type SurveyKind } from "@/types/survey";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** ?kind=completion (default) | followup | impact — which of the course's surveys. */
function surveyKind(req: NextRequest): SurveyKind {
  return parseSurveyKind(req.nextUrl.searchParams.get("kind"));
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;

  const { data: survey, error } = await supabaseAdmin
    .from("course_surveys")
    .select("*")
    .eq("course_id", courseId)
    .eq("survey_kind", surveyKind(req))
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!survey) return NextResponse.json({ data: null, questions: [] });

  const { data: questions } = await supabaseAdmin
    .from("survey_questions")
    .select("*")
    .eq("survey_id", survey.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ data: survey, questions: questions ?? [] });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;
  const body = await request.json().catch(() => ({}));

  const payload = {
    course_id: courseId,
    survey_kind: surveyKind(request),
    title: body.title ?? null,
    title_ar: body.title_ar ?? null,
    description: body.description ?? null,
    description_ar: body.description_ar ?? null,
    is_required: body.is_required ?? true,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabaseAdmin
    .from("course_surveys")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of [
    "title",
    "title_ar",
    "description",
    "description_ar",
    "is_required",
    "is_active",
  ] as const) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabaseAdmin
    .from("course_surveys")
    .update(update)
    .eq("course_id", courseId)
    .eq("survey_kind", surveyKind(request))
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: courseId } = await params;
  const { error } = await supabaseAdmin
    .from("course_surveys")
    .delete()
    .eq("course_id", courseId)
    .eq("survey_kind", surveyKind(req));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
