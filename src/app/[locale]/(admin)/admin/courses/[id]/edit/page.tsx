"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { CourseForm } from "@/components/admin/CourseForm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { CourseInput } from "@/lib/utils/validators";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const t = useTranslations("admin");

  const [courseData, setCourseData] = useState<
    (Partial<CourseInput> & { id: string; slug: string; status: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (!error && data) {
        setCourseData({
          id: data.id,
          slug: data.slug,
          status: data.status,
          title: data.title,
          titleAr: data.title_ar,
          description: data.description,
          descriptionAr: data.description_ar,
          shortDescription: data.short_description,
          shortDescriptionAr: data.short_description_ar,
          categoryId: data.category_id,
          instructorId: data.instructor_id,
          difficultyLevel: data.difficulty_level,
          price: data.price,
          currency: data.currency,
          isFree: data.is_free,
          isFeatured: data.is_featured,
          certificateEnabled: data.certificate_enabled,
          passingScore: data.passing_score,
          learningOutcomes: data.learning_outcomes,
          learningOutcomesAr: data.learning_outcomes_ar,
          tags: data.tags,
        });
      }
      setIsLoading(false);
    }

    if (courseId) fetchCourse();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("editCourse")}</h1>
      <CourseForm mode="edit" initialData={courseData} />
    </div>
  );
}
