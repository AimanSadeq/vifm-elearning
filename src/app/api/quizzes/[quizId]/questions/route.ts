import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { quizQuestionSchema } from "@/lib/utils/validators";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
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

    const isAdmin = profile?.role === "super_admin";

    // Fetch questions with options
    const { data: questions, error } = await supabase
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("quiz_id", quizId)
      .order("sort_order");

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Strip is_correct for learners
    const result = isAdmin
      ? questions
      : questions?.map((q) => ({
          ...q,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          options: (q.options ?? []).map(({ is_correct, ...opt }: { is_correct: boolean; [key: string]: unknown }) => opt),
        }));

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
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

    // Get next sort_order
    const { data: lastQ } = await supabaseAdmin
      .from("quiz_questions")
      .select("sort_order")
      .eq("quiz_id", quizId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastQ?.sort_order ?? -1) + 1;

    // Insert question
    const { data: question, error: qError } = await supabaseAdmin
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_text: parsed.data.questionText,
        question_text_ar: parsed.data.questionTextAr ?? null,
        question_type: parsed.data.questionType,
        points: parsed.data.points,
        explanation: parsed.data.explanation ?? null,
        explanation_ar: parsed.data.explanationAr ?? null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (qError)
      return NextResponse.json({ error: qError.message }, { status: 500 });

    // Insert options if provided
    if (parsed.data.options && parsed.data.options.length > 0) {
      const options = parsed.data.options.map((opt, idx) => ({
        question_id: question.id,
        option_text: opt.optionText,
        option_text_ar: opt.optionTextAr ?? null,
        is_correct: opt.isCorrect,
        sort_order: idx,
      }));

      const { error: oError } = await supabaseAdmin
        .from("quiz_options")
        .insert(options);

      if (oError)
        return NextResponse.json({ error: oError.message }, { status: 500 });
    }

    // Return question with options
    const { data: full } = await supabaseAdmin
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("id", question.id)
      .single();

    return NextResponse.json({ data: full }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
