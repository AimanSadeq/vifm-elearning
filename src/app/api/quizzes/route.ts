import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { quizSchema } from "@/lib/utils/validators";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId)
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    const isAdmin = profile?.role === "super_admin";

    let query = supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order");

    // Learners only see published quizzes
    if (!isAdmin) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;
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

export async function POST(request: NextRequest) {
  try {
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
      .insert({
        course_id: body.courseId,
        lesson_id: body.lessonId ?? null,
        title: parsed.data.title,
        title_ar: parsed.data.titleAr ?? null,
        description: parsed.data.description ?? null,
        is_final_exam: parsed.data.isFinalExam,
        passing_score: parsed.data.passingScore,
        time_limit_minutes: parsed.data.timeLimitMinutes ?? null,
        max_attempts: parsed.data.maxAttempts,
        shuffle_questions: parsed.data.shuffleQuestions,
        show_correct_answers: parsed.data.showCorrectAnswers,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
