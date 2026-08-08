"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
} from "lucide-react";
import { useQuizStore } from "@/stores/quiz-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MatchingQuestion } from "./MatchingQuestion";
import type { Quiz, QuizQuestion } from "@/types";

interface QuizPlayerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onComplete: (result: Record<string, unknown>) => void;
}

export function QuizPlayer({ quiz, questions, onComplete }: QuizPlayerProps) {
  const locale = useLocale();
  const tq = useTranslations("quiz");
  const startTimeRef = useRef(Date.now());

  const {
    answers,
    currentQuestionIndex,
    timeRemaining,
    isSubmitting,
    setAnswer,
    setCurrentQuestion,
    setTimeRemaining,
    setSubmitting,
    reset,
    getAnswersArray,
  } = useQuizStore();

  // Initialize
  useEffect(() => {
    reset();
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
    startTimeRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, setTimeRemaining]);

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: getAnswersArray(),
          timeSpentSeconds: timeSpent,
        }),
      });

      const { data, error } = await res.json();
      if (error) {
        alert(error);
        return;
      }

      onComplete(data);
    } finally {
      setSubmitting(false);
    }
  }, [quiz.id, getAnswersArray, onComplete, setSubmitting]);

  if (!currentQuestion) return null;

  const qText =
    locale === "ar" && currentQuestion.question_text_ar
      ? currentQuestion.question_text_ar
      : currentQuestion.question_text;

  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header: progress + timer */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {tq("question")} {currentQuestionIndex + 1} {tq("of")} {questions.length}
        </span>
        {timeRemaining !== null && (
          <div
            className={`flex items-center gap-1 text-sm font-mono ${
              timeRemaining < 60 ? "text-destructive animate-pulse" : ""
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-medium">{qText}</p>
            {currentQuestion.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentQuestion.image_url}
                alt=""
                className="max-h-80 w-full rounded-md border object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">
              {currentQuestion.points} point
              {currentQuestion.points !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Answer inputs based on type */}
          {(currentQuestion.question_type === "multiple_choice" ||
            currentQuestion.question_type === "true_false") && (
            <div className="space-y-2">
              {(currentQuestion.options ?? []).map((opt) => {
                const optText =
                  locale === "ar" && opt.option_text_ar
                    ? opt.option_text_ar
                    : opt.option_text;
                const isSelected =
                  currentAnswer?.selectedOptionIds?.includes(opt.id) ?? false;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setAnswer(currentQuestion.id, {
                        selectedOptionIds: [opt.id],
                      })
                    }
                    className={`w-full text-start rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {optText}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.question_type === "multi_select" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {tq("selectAll")}
              </p>
              {(currentQuestion.options ?? []).map((opt) => {
                const optText =
                  locale === "ar" && opt.option_text_ar
                    ? opt.option_text_ar
                    : opt.option_text;
                const selected = currentAnswer?.selectedOptionIds ?? [];
                const isChecked = selected.includes(opt.id);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const newSelected = isChecked
                        ? selected.filter((id) => id !== opt.id)
                        : [...selected, opt.id];
                      setAnswer(currentQuestion.id, {
                        selectedOptionIds: newSelected,
                      });
                    }}
                    className={`w-full text-start rounded-lg border p-3 transition-colors ${
                      isChecked
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="me-2">{isChecked ? "☑" : "☐"}</span>
                    {optText}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.question_type === "matching" && (
            <MatchingQuestion
              question={currentQuestion}
              value={currentAnswer?.matches ?? {}}
              onChange={(matches) =>
                setAnswer(currentQuestion.id, { matches })
              }
            />
          )}

          {currentQuestion.question_type === "short_answer" && (
            <Input
              placeholder={tq("typeAnswer")}
              value={currentAnswer?.textAnswer ?? ""}
              onChange={(e) =>
                setAnswer(currentQuestion.id, { textAnswer: e.target.value })
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {tq("previous")}
        </Button>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestion(idx)}
              className={`h-3 w-3 rounded-full transition-colors ${
                idx === currentQuestionIndex
                  ? "bg-primary"
                  : answers[q.id]
                    ? "bg-primary/40"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="h-4 w-4 me-1" />
            {isSubmitting ? tq("submitting") : tq("submitQuiz")}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
          >
            {tq("next")}
            <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}
