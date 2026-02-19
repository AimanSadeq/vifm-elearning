import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { submitQuizSchema } from "@/lib/utils/validators";
import {
  scoreQuizAttempt,
  type QuestionData,
} from "@/lib/services/quiz-scoring";
import { issueCertificate } from "@/lib/services/certificate-service";

interface RouteParams {
  params: { quizId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = submitQuizSchema.safeParse({
      ...body,
      quizId: params.quizId,
    });
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("id", params.quizId)
      .single();

    if (quizError || !quiz)
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Verify enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", quiz.course_id)
      .in("status", ["active", "completed"])
      .single();

    if (!enrollment)
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );

    // Check attempt count
    const { count } = await supabaseAdmin
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", params.quizId)
      .eq("user_id", user.id);

    const attemptNumber = (count ?? 0) + 1;
    if (quiz.max_attempts && attemptNumber > quiz.max_attempts)
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );

    // Fetch questions with correct answers (admin client bypasses RLS)
    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("quiz_id", params.quizId)
      .order("sort_order");

    if (!questions || questions.length === 0)
      return NextResponse.json(
        { error: "No questions in quiz" },
        { status: 400 }
      );

    // Score
    const questionData: QuestionData[] = questions.map((q) => ({
      id: q.id,
      question_type: q.question_type,
      points: Number(q.points),
      options: (q.options ?? []).map(
        (o: { id: string; is_correct: boolean; option_text: string }) => ({
          id: o.id,
          is_correct: o.is_correct,
          option_text: o.option_text,
        })
      ),
    }));

    const result = scoreQuizAttempt(questionData, parsed.data.answers);
    const passed = result.percentage >= Number(quiz.passing_score);

    // Insert attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        quiz_id: params.quizId,
        user_id: user.id,
        score: result.score,
        max_score: result.maxScore,
        percentage: result.percentage,
        passed,
        answers: parsed.data.answers,
        time_spent_seconds: parsed.data.timeSpentSeconds,
        attempt_number: attemptNumber,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError)
      return NextResponse.json(
        { error: attemptError.message },
        { status: 500 }
      );

    // If final exam and passed, issue certificate
    let certificate = null;
    if (quiz.is_final_exam && passed) {
      try {
        certificate = await issueCertificate({
          userId: user.id,
          courseId: quiz.course_id,
          enrollmentId: enrollment.id,
        });
      } catch (err) {
        console.error("Certificate issuance error:", err);
      }
    }

    // Build response — strip correct answers if quiz config says so
    const response: Record<string, unknown> = {
      attemptId: attempt.id,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed,
      attemptNumber,
      certificate: certificate
        ? {
            id: certificate.id,
            certificateNumber: certificate.certificate_number,
            pdfUrl: certificate.pdf_url,
          }
        : null,
    };

    if (quiz.show_correct_answers) {
      response.questionResults = result.questionResults;
    }

    return NextResponse.json({ data: response });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
