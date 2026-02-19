"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { QuizPlayer } from "./QuizPlayer";
import { QuizResults } from "./QuizResults";
import type { Quiz, QuizQuestion, QuizAttempt } from "@/types";

interface QuizGateProps {
  lessonId: string;
  courseId: string;
}

export function QuizGate({ lessonId, courseId }: QuizGateProps) {
  const locale = useLocale();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(
    null
  );

  useEffect(() => {
    fetchQuizData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId]);

  async function fetchQuizData() {
    setIsLoading(true);
    try {
      // Find quiz for this lesson
      const quizRes = await fetch(`/api/quizzes?courseId=${courseId}`);
      const { data: quizzes } = await quizRes.json();

      const matchedQuiz = (quizzes ?? []).find(
        (q: Quiz) => q.lesson_id === lessonId
      );

      if (!matchedQuiz) {
        setIsLoading(false);
        return;
      }

      setQuiz(matchedQuiz);

      // Fetch questions (without correct answers for learners)
      const questionsRes = await fetch(
        `/api/quizzes/${matchedQuiz.id}/questions`
      );
      const { data: questionsData } = await questionsRes.json();
      setQuestions(questionsData ?? []);

      // Fetch attempts
      const attemptsRes = await fetch(
        `/api/quizzes/${matchedQuiz.id}/attempts`
      );
      const { data: attemptsData } = await attemptsRes.json();
      setAttempts(attemptsData ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-muted-foreground">No quiz found for this lesson.</p>
      </div>
    );
  }

  // Show results if just completed
  if (lastResult) {
    return (
      <QuizResults
        result={lastResult}
        quiz={quiz}
        onRetry={() => {
          setLastResult(null);
          setIsStarted(false);
          fetchQuizData();
        }}
      />
    );
  }

  // Show quiz player if started
  if (isStarted) {
    return (
      <QuizPlayer
        quiz={quiz}
        questions={questions}
        onComplete={(result) => {
          setLastResult(result);
          setIsStarted(false);
        }}
      />
    );
  }

  const quizTitle =
    locale === "ar" && quiz.title_ar ? quiz.title_ar : quiz.title;
  const quizDescription =
    locale === "ar" && quiz.description_ar
      ? quiz.description_ar
      : quiz.description;

  const attemptsUsed = attempts.length;
  const canAttempt = !quiz.max_attempts || attemptsUsed < quiz.max_attempts;
  const bestAttempt = attempts.length > 0
    ? attempts.reduce(
        (best, a) =>
          (a.percentage ?? 0) > (best.percentage ?? 0) ? a : best,
        attempts[0]
      )
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <ClipboardCheck className="mx-auto h-12 w-12 text-primary" />
          <h2 className="text-2xl font-bold">{quizTitle}</h2>
          {quizDescription && (
            <p className="text-muted-foreground">{quizDescription}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ClipboardCheck className="h-4 w-4" />
              <span>{questions.length} questions</span>
            </div>
            {quiz.time_limit_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.time_limit_minutes} min</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Pass: {quiz.passing_score}%</span>
            </div>
          </div>

          {quiz.is_final_exam && (
            <Badge variant="warning">Final Exam — Certificate on Pass</Badge>
          )}

          {/* Previous attempts */}
          {attempts.length > 0 && (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">Previous Attempts</p>
              <div className="space-y-1">
                {attempts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>Attempt #{a.attempt_number ?? attempts.indexOf(a) + 1}</span>
                    <span
                      className={
                        a.passed
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {a.percentage?.toFixed(0)}% —{" "}
                      {a.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
              {bestAttempt && (
                <p className="text-muted-foreground">
                  Best: {bestAttempt.percentage?.toFixed(0)}%
                </p>
              )}
            </div>
          )}

          {/* Attempt limit info */}
          {quiz.max_attempts && (
            <p className="text-sm text-muted-foreground">
              Attempts: {attemptsUsed} / {quiz.max_attempts}
            </p>
          )}

          {canAttempt ? (
            <Button size="lg" onClick={() => setIsStarted(true)}>
              {attempts.length > 0 ? "Retry Quiz" : "Start Quiz"}
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <p className="text-muted-foreground">
                Maximum attempts reached
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
