"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { quizSchema, type QuizInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface QuizFormProps {
  initialData?: Partial<QuizInput>;
  onSubmit: (data: QuizInput) => Promise<void>;
  isLoading?: boolean;
}

export function QuizForm({ initialData, onSubmit, isLoading }: QuizFormProps) {
  const t = useTranslations("common");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuizInput>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      titleAr: initialData?.titleAr ?? "",
      description: initialData?.description ?? "",
      isFinalExam: initialData?.isFinalExam ?? false,
      passingScore: initialData?.passingScore ?? 70,
      timeLimitMinutes: initialData?.timeLimitMinutes ?? null,
      maxAttempts: initialData?.maxAttempts ?? 3,
      shuffleQuestions: initialData?.shuffleQuestions ?? false,
      showCorrectAnswers: initialData?.showCorrectAnswers ?? true,
    },
  });

  // The parent fetches the quiz async, so `initialData` is undefined on
  // first mount and arrives a tick later. `defaultValues` only run once on
  // mount, so without this `reset()` the title/description stay blank even
  // though the row has data. Watching the JSON shape (rather than the prop
  // identity) avoids a reset loop when the parent re-renders with the same
  // values during normal interaction.
  const initialKey = initialData ? JSON.stringify(initialData) : "";
  useEffect(() => {
    if (!initialData) return;
    reset({
      title: initialData.title ?? "",
      titleAr: initialData.titleAr ?? "",
      description: initialData.description ?? "",
      isFinalExam: initialData.isFinalExam ?? false,
      passingScore: initialData.passingScore ?? 70,
      timeLimitMinutes: initialData.timeLimitMinutes ?? null,
      maxAttempts: initialData.maxAttempts ?? 3,
      shuffleQuestions: initialData.shuffleQuestions ?? false,
      showCorrectAnswers: initialData.showCorrectAnswers ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Quiz Settings</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title (English)</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleAr">Title (Arabic)</Label>
              <Input id="titleAr" dir="rtl" {...register("titleAr")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                {...register("passingScore", { valueAsNumber: true })}
              />
              {errors.passingScore && (
                <p className="text-sm text-destructive">
                  {errors.passingScore.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                {...register("maxAttempts", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimitMinutes">Time Limit (minutes)</Label>
              <Input
                id="timeLimitMinutes"
                type="number"
                placeholder="No limit"
                {...register("timeLimitMinutes", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("isFinalExam")} />
              Final Exam (triggers certificate)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("shuffleQuestions")} />
              Shuffle Questions
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("showCorrectAnswers")} />
              Show Correct Answers
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("loading") : t("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
