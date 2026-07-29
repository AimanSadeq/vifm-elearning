import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { quizSchema } from "@/lib/utils/validators";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );

    const { data, error } = await supabaseAdmin
      .from("quizzes")
      .update({
        title: parsed.data.title,
        title_ar: parsed.data.titleAr ?? null,
        description: parsed.data.description ?? null,
        is_final_exam: parsed.data.isFinalExam,
        passing_score: parsed.data.passingScore,
        time_limit_minutes: parsed.data.timeLimitMinutes ?? null,
        max_attempts: parsed.data.maxAttempts,
        shuffle_questions: parsed.data.shuffleQuestions,
        show_correct_answers: parsed.data.showCorrectAnswers,
        is_published: body.isPublished ?? false,
      })
      .eq("id", quizId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await supabaseAdmin
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Quiz deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
