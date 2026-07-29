import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { quizQuestionSchema } from "@/lib/utils/validators";
import { userHasCourseAccess } from "@/lib/services/access";

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

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    const isAdmin = profile?.role === "super_admin";

    // Resolve the owning course so we can authorize the caller. The
    // user-scoped client is used (RLS-respecting); admin escalation only
    // happens after we've confirmed access, never as the access check.
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("id, course_id, is_published")
      .eq("id", quizId)
      .maybeSingle();

    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Pull instructor_id alongside the access check so we know whether to
    // expose answer keys (super_admin + course's own instructor only).
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("is_free, instructor_id, status")
      .eq("id", quiz.course_id)
      .maybeSingle();

    const isInstructor =
      !!course?.instructor_id && course.instructor_id === user.id;

    // Non-admin/non-instructor callers cannot see draft quizzes. Even if
    // the course were free, an unpublished quiz isn't part of the catalog.
    if (!isAdmin && !isInstructor && !quiz.is_published) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Course-access gate (super_admin / free course / instructor /
    // enrollment / subscription).
    const allowed = await userHasCourseAccess(user.id, quiz.course_id, {
      course,
      authMetadata: { role: profile?.role ?? undefined },
    });
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch questions with options. Use admin client because RLS for
    // quiz_options/quiz_questions varies by role; we've already authorized
    // and we strip the answer key below for non-authors.
    const { data: questions, error } = await supabaseAdmin
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("quiz_id", quizId)
      .order("sort_order");

    if (error) {
      console.error("quiz questions fetch failed", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Only super_admins and the course's own instructor get the answer
    // key. Every other authenticated viewer (including other instructors)
    // sees options without `is_correct`.
    const canSeeAnswers = isAdmin || isInstructor;
    const result = canSeeAnswers
      ? questions
      : questions?.map((q) => ({
          ...q,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          options: (q.options ?? []).map(({ is_correct, ...opt }: { is_correct: boolean; [key: string]: unknown }) => opt),
        }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/quizzes/[quizId]/questions failed", err);
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

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

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
        image_url: parsed.data.imageUrl || null,
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
