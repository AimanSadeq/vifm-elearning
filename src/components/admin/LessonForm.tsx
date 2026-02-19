"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { lessonSchema, type LessonInput } from "@/lib/utils/validators";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Lesson } from "@/types";

interface LessonFormProps {
  courseId: string;
  moduleId: string;
  sortOrder: number;
  initialData?: Lesson | null;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

export function LessonForm({
  courseId,
  moduleId,
  sortOrder,
  initialData,
  onSave,
  onCancel,
}: LessonFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LessonInput>({
    resolver: zodResolver(lessonSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          titleAr: initialData.title_ar ?? undefined,
          contentType: initialData.content_type,
          description: initialData.description ?? undefined,
          descriptionAr: initialData.description_ar ?? undefined,
          isPreview: initialData.is_preview,
          isMandatory: initialData.is_mandatory,
          durationMinutes: initialData.duration_minutes || undefined,
        }
      : {
          contentType: "video",
          isPreview: false,
          isMandatory: true,
        },
  });

  const onSubmit = async (data: LessonInput) => {
    setError(null);
    const supabase = createClient();

    const lessonData = {
      course_id: courseId,
      module_id: moduleId,
      title: data.title,
      title_ar: data.titleAr || null,
      content_type: data.contentType,
      description: data.description || null,
      description_ar: data.descriptionAr || null,
      is_preview: data.isPreview,
      is_mandatory: data.isMandatory,
      duration_minutes: data.durationMinutes || 0,
      sort_order: isEditing ? initialData!.sort_order : sortOrder,
    };

    if (isEditing) {
      const { data: updated, error: updateError } = await supabase
        .from("lessons")
        .update(lessonData)
        .eq("id", initialData!.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }
      onSave(updated as Lesson);
    } else {
      const { data: created, error: createError } = await supabase
        .from("lessons")
        .insert(lessonData)
        .select()
        .single();

      if (createError) {
        setError(createError.message);
        return;
      }
      onSave(created as Lesson);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {error && (
            <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="lessonTitle">Title</Label>
              <Input
                id="lessonTitle"
                {...register("title")}
                placeholder="Lesson title"
              />
              {errors.title && (
                <p className="text-xs text-error">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="lessonTitleAr">Title (Arabic)</Label>
              <Input
                id="lessonTitleAr"
                dir="rtl"
                {...register("titleAr")}
                placeholder="عنوان الدرس"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="contentType">Content Type</Label>
              <select
                id="contentType"
                {...register("contentType")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="0"
                {...register("durationMinutes", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("isPreview")}
                  className="rounded border"
                />
                Preview
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("isMandatory")}
                  className="rounded border"
                />
                Mandatory
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lessonDescription">Description</Label>
            <Textarea
              id="lessonDescription"
              {...register("description")}
              placeholder="Brief description of this lesson"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3 w-3 me-1 animate-spin" />}
              {isEditing ? "Update Lesson" : "Add Lesson"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
