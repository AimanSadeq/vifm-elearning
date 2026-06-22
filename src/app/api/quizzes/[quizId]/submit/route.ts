import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { submitQuizSchema } from "@/lib/utils/validators";
import {
  scoreQuizAttempt,
  type QuestionData,
} from "@/lib/services/quiz-scoring";
import { issueCertificate } from "@/lib/services/certificate-service";
import { recalculateAllPathsForUser } from "@/lib/services/learning-path-service";
import { getCompletedLessonIds } from "@/lib/services/progress-service";

interface RouteParams {
  params: Promise<{ quizId: string }>;
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

    const body = await request.json();
    const parsed = submitQuizSchema.safeParse({
      ...body,
      quizId: quizId,
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
      .eq("id", quizId)
      .single();

    if (quizError || !quiz)
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Look up the caller's role so super_admin can submit against drafts
    // for testing without disabling the published-state guard for everyone.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "super_admin";

    // Block submissions to draft quizzes — they aren't part of the
    // published catalog. Without this, a learner can pull `/api/quizzes/
    // [quizId]/submit` directly with a draft id and burn `max_attempts`
    // (or accidentally generate certificates from un-released content).
    if (!quiz.is_published && !isAdmin) {
      return NextResponse.json(
        { error: "Quiz is not available" },
        { status: 403 }
      );
    }

    // Verify enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", quiz.course_id)
      .in("status", ["active", "completed"])
      .single();

    if (!enrollment && !isAdmin)
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );

    // Check attempt count
    const { count } = await supabaseAdmin
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)
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
      .eq("quiz_id", quizId)
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
        quiz_id: quizId,
        user_id: user.id,
        score: result.score,
        total_points: result.maxScore,
        percentage: result.percentage,
        passed,
        answers: parsed.data.answers,
        time_taken_seconds: parsed.data.timeSpentSeconds,
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

    // Mark quiz lesson as completed on pass
    if (passed && quiz.lesson_id) {
      const supabase = await createServerSupabase();

      // Upsert lesson_progress
      await supabaseAdmin
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: quiz.lesson_id,
            course_id: quiz.course_id,
            is_completed: true,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );

      // Update enrollment completed_lesson_ids and progress
      const { data: enrollmentData } = await supabaseAdmin
        .from("enrollments")
        .select("id, completed_lesson_ids, total_lesson_items")
        .eq("user_id", user.id)
        .eq("course_id", quiz.course_id)
        .single();

      if (enrollmentData) {
        // Count completed lessons from lesson_progress (just upserted above)
        // rather than the lossy completed_lesson_ids array.
        const completedIds = await getCompletedLessonIds(
          user.id,
          quiz.course_id as string,
        );

        const totalItems = enrollmentData.total_lesson_items ?? 0;
        const completedItems = completedIds.length;
        const progressPct =
          totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : 0;
        const courseCompleted =
          totalItems > 0 && completedItems >= totalItems;

        await supabaseAdmin
          .from("enrollments")
          .update({
            completed_lesson_ids: completedIds,
            completed_lesson_items: completedItems,
            progress_percentage: progressPct,
            ...(courseCompleted
              ? {
                  status: "completed",
                  completed_at: new Date().toISOString(),
                }
              : {}),
          })
          .eq("id", enrollmentData.id);

        if (courseCompleted) {
          recalculateAllPathsForUser(supabase, user.id).catch(() => {});
        }
      }
    }

    // If final exam and passed, issue certificate. Admin smoke-tests can
    // submit without an enrollment row, so skip cert issuance in that
    // case — there's nothing to attach the certificate to.
    let certificate = null;
    if (quiz.is_final_exam && passed && enrollment) {
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
