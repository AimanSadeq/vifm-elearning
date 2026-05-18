import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { questionId } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of [
    "question_text",
    "question_text_ar",
    "question_type",
    "options",
    "is_required",
  ] as const) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await supabaseAdmin
    .from("survey_questions")
    .update(update)
    .eq("id", questionId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { questionId } = await params;
  const { error } = await supabaseAdmin
    .from("survey_questions")
    .delete()
    .eq("id", questionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
