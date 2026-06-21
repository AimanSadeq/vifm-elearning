"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  learningPathSchema,
  type LearningPathInput,
} from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface LearningPathFormProps {
  initialData?: Partial<LearningPathInput> & { id?: string };
  onSubmit: (data: LearningPathInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CourseOption {
  id: string;
  title: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function LearningPathForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: LearningPathFormProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LearningPathInput>({
    resolver: zodResolver(learningPathSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      titleAr: initialData?.titleAr ?? "",
      description: initialData?.description ?? "",
      descriptionAr: initialData?.descriptionAr ?? "",
      difficultyLevel: initialData?.difficultyLevel ?? "gateway",
      categoryId: initialData?.categoryId ?? "",
      estimatedHours: initialData?.estimatedHours ?? 0,
      isPublished: initialData?.isPublished ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      sortOrder: initialData?.sortOrder ?? 0,
      courses: initialData?.courses ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "courses",
  });

  // Fetch published courses and categories
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [coursesRes, categoriesRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title")
          .eq("status", "published")
          .order("title"),
        supabase.from("categories").select("id, name").order("name"),
      ]);
      setCourses(coursesRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
    }
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          {initialData?.id ? "Edit Learning Path" : "Create Learning Path"}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Title (EN/AR) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title (English)</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g. Full Stack Development"
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleAr">Title (Arabic)</Label>
              <Input
                id="titleAr"
                {...register("titleAr")}
                placeholder="العنوان بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 2: Description (EN/AR) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description (English)</Label>
              <textarea
                id="description"
                {...register("description")}
                placeholder="Describe this learning path..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <textarea
                id="descriptionAr"
                {...register("descriptionAr")}
                placeholder="الوصف بالعربية"
                dir="rtl"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Row 3: Difficulty, Category, Estimated Hours */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Difficulty Level</Label>
              <select
                id="difficultyLevel"
                {...register("difficultyLevel")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="gateway">Gateway</option>
                <option value="professional">Professional</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                {...register("estimatedHours", { valueAsNumber: true })}
                placeholder="e.g. 40"
              />
              {errors.estimatedHours && (
                <p className="text-sm text-destructive">
                  {errors.estimatedHours.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Sort Order + Toggles */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isPublished"
                type="checkbox"
                {...register("isPublished")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublished" className="text-sm">
                Published
              </Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isFeatured"
                type="checkbox"
                {...register("isFeatured")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isFeatured" className="text-sm">
                Featured
              </Label>
            </div>
          </div>

          {/* Course Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Courses in this Path</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    courseId: "",
                    sortOrder: fields.length,
                    isRequired: true,
                  })
                }
              >
                <Plus className="h-4 w-4 me-1" />
                Add Course
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No courses added yet. Click &quot;Add Course&quot; to begin.
              </p>
            )}

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="shrink-0 text-sm font-medium text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>

                  <select
                    {...register(`courses.${index}.courseId`)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">Select a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    {...register(`courses.${index}.sortOrder`, {
                      valueAsNumber: true,
                    })}
                    className="h-9 w-20"
                    placeholder="Order"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      {...register(`courses.${index}.isRequired`)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Required
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {errors.courses && (
              <p className="text-sm text-destructive">
                {typeof errors.courses.message === "string"
                  ? errors.courses.message
                  : "Please fix course selection errors"}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : initialData?.id
                  ? "Update Learning Path"
                  : "Create Learning Path"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
