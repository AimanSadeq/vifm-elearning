"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, GripVertical, Pencil, Upload } from "lucide-react";
import { QuizForm } from "./QuizForm";
import { QuestionForm } from "./QuestionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Quiz, QuizQuestion } from "@/types";
import type { QuizInput } from "@/lib/utils/validators";

// Defer the dialog (and its ~1MB xlsx dependency) until the admin actually
// clicks "Bulk upload". Without this, every quiz editor load pulls xlsx in.
const BulkQuestionUploadDialog = dynamic(
  () =>
    import("./BulkQuestionUploadDialog").then((m) => m.BulkQuestionUploadDialog),
  { ssr: false }
);

interface QuizBuilderProps {
  courseId: string;
  quizId?: string;
}

export function QuizBuilder({ courseId, quizId }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null
  );

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  async function fetchQuiz() {
    const res = await fetch(`/api/quizzes/${quizId}`);
    const { data } = await res.json();
    if (data) setQuiz(data);
  }

  async function fetchQuestions() {
    const res = await fetch(`/api/quizzes/${quizId}/questions`);
    const { data } = await res.json();
    if (data) setQuestions(data);
  }

  async function handleSaveQuiz(data: QuizInput) {
    setIsSaving(true);
    try {
      if (quizId) {
        await fetch(`/api/quizzes/${quizId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        const res = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, courseId }),
        });
        const { data: newQuiz } = await res.json();
        if (newQuiz) {
          setQuiz(newQuiz);
          // Update URL to include quiz ID
          window.history.replaceState(null, "", `?quizId=${newQuiz.id}`);
        }
      }
      await fetchQuiz();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveQuestion(data: {
    questionText: string;
    questionTextAr: string;
    questionType: string;
    points: number;
    explanation: string;
    explanationAr: string;
    options: { optionText: string; optionTextAr: string; isCorrect: boolean }[];
  }) {
    setIsSaving(true);
    try {
      const currentQuizId = quizId ?? quiz?.id;
      if (!currentQuizId) return;

      const url = editingQuestion
        ? `/api/quizzes/${currentQuizId}/questions/${editingQuestion.id}`
        : `/api/quizzes/${currentQuizId}/questions`;

      await fetch(url, {
        method: editingQuestion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      await fetchQuestions();
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) return;
    const currentQuizId = quizId ?? quiz?.id;
    if (!currentQuizId) return;

    await fetch(`/api/quizzes/${currentQuizId}/questions/${questionId}`, {
      method: "DELETE",
    });
    await fetchQuestions();
  }

  async function handlePublishToggle() {
    if (!quiz) return;
    const currentQuizId = quizId ?? quiz.id;
    await fetch(`/api/quizzes/${currentQuizId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...quiz,
        titleAr: quiz.title_ar,
        isFinalExam: quiz.is_final_exam,
        passingScore: quiz.passing_score,
        timeLimitMinutes: quiz.time_limit_minutes,
        maxAttempts: quiz.max_attempts,
        shuffleQuestions: quiz.shuffle_questions,
        showCorrectAnswers: quiz.show_correct_answers,
        isPublished: !quiz.is_published,
      }),
    });
    await fetchQuiz();
  }

  const quizFormData = quiz
    ? {
        title: quiz.title,
        titleAr: quiz.title_ar ?? "",
        description: quiz.description ?? "",
        isFinalExam: quiz.is_final_exam,
        passingScore: quiz.passing_score,
        timeLimitMinutes: quiz.time_limit_minutes ?? undefined,
        maxAttempts: quiz.max_attempts,
        shuffleQuestions: quiz.shuffle_questions,
        showCorrectAnswers: quiz.show_correct_answers,
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Quiz settings form */}
      <QuizForm
        initialData={quizFormData}
        onSubmit={handleSaveQuiz}
        isLoading={isSaving}
      />

      {/* Questions list — only show if quiz exists */}
      {(quizId || quiz) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Questions ({questions.length})
            </h3>
            <div className="flex gap-2">
              {quiz && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublishToggle}
                >
                  {quiz.is_published ? "Unpublish" : "Publish"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkUpload(true)}
                disabled={!quizId && !quiz}
              >
                <Upload className="h-4 w-4 me-1" />
                Bulk upload
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingQuestion(null);
                  setShowQuestionForm(true);
                }}
              >
                <Plus className="h-4 w-4 me-1" />
                Add Question
              </Button>
            </div>
          </div>

          {showBulkUpload && (quizId || quiz) && (
            <BulkQuestionUploadDialog
              quizId={(quizId ?? quiz?.id) as string}
              onClose={() => setShowBulkUpload(false)}
              onComplete={() => {
                fetchQuestions();
              }}
            />
          )}

          {/* Question form */}
          {showQuestionForm && (
            <QuestionForm
              initialData={
                editingQuestion
                  ? {
                      questionText: editingQuestion.question_text,
                      questionTextAr: editingQuestion.question_text_ar ?? "",
                      questionType: editingQuestion.question_type,
                      points: editingQuestion.points,
                      explanation: editingQuestion.explanation ?? "",
                      explanationAr: editingQuestion.explanation_ar ?? "",
                      options: (editingQuestion.options ?? []).map((o) => ({
                        optionText: o.option_text,
                        optionTextAr: o.option_text_ar ?? "",
                        isCorrect: o.is_correct,
                      })),
                    }
                  : undefined
              }
              onSubmit={handleSaveQuestion}
              onCancel={() => {
                setShowQuestionForm(false);
                setEditingQuestion(null);
              }}
              isLoading={isSaving}
            />
          )}

          {/* Question list */}
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Q{idx + 1}. {q.question_text}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {q.question_type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {q.points} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingQuestion(q);
                          setShowQuestionForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Show options preview */}
                  {q.options && q.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`text-sm flex items-center gap-2 ${
                            opt.is_correct
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span>{opt.is_correct ? "●" : "○"}</span>
                          <span>{opt.option_text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {questions.length === 0 && !showQuestionForm && (
            <div className="text-center py-8 text-muted-foreground">
              No questions yet. Click &quot;Add Question&quot; to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
