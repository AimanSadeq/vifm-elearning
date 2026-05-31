import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { quizQuestionSchema } from "@/lib/utils/validators";

interface RouteParams {
  params: Promise<{ quizId: string; questionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = quizQuestionSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );

    // Update question
    const { error: qError } = await supabaseAdmin
      .from("quiz_questions")
      .update({
        question_text: parsed.data.questionText,
        question_text_ar: parsed.data.questionTextAr ?? null,
        image_url: parsed.data.imageUrl || null,
        question_type: parsed.data.questionType,
        points: parsed.data.points,
        explanation: parsed.data.explanation ?? null,
        explanation_ar: parsed.data.explanationAr ?? null,
      })
      .eq("id", questionId);

    if (qError)
      return NextResponse.json({ error: qError.message }, { status: 500 });

    // Replace options: delete old, insert new
    if (parsed.data.options) {
      await supabaseAdmin
        .from("quiz_options")
        .delete()
        .eq("question_id", questionId);

      if (parsed.data.options.length > 0) {
        const options = parsed.data.options.map((opt, idx) => ({
          question_id: questionId,
          option_text: opt.optionText,
          option_text_ar: opt.optionTextAr ?? null,
          is_correct: opt.isCorrect,
          sort_order: idx,
        }));

        await supabaseAdmin.from("quiz_options").insert(options);
      }
    }

    // Return updated question with options
    const { data: full } = await supabaseAdmin
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("id", questionId)
      .single();

    return NextResponse.json({ data: full });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { questionId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabaseAdmin
      .from("quiz_questions")
      .delete()
      .eq("id", questionId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Question deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
