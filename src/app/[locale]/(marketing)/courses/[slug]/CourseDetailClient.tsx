"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchCurriculum } from "@/lib/api/curriculum-client";
import { CourseDetail } from "@/components/courses/CourseDetail";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Course, Module } from "@/types";

export default function CourseDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations("common");
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = user?.role === "super_admin";

  useEffect(() => {
    async function fetchCourseDetail() {
      const supabase = createClient();

      // Fetch course — admins can view any status, others only published
      let query = supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(id, name, name_ar, slug, color),
          instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
        `
        )
        .eq("slug", slug);

      if (!isAdmin) {
        query = query.eq("status", "published");
      }

      const { data: courseData, error: courseError } = await query.single();

      if (courseError || !courseData) {
        setError(true);
        setIsLoading(false);
        return;
      }

      setCourse(courseData as Course);

      // Through the API: a browser `lessons(*)` embed fails with 42501.
      const modulesData = await fetchCurriculum(courseData);
      if (modulesData) setModules(modulesData);

      setIsLoading(false);
    }

    if (slug) fetchCourseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-bold">{t("error")}</h1>
        <p className="mt-2 text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return <CourseDetail course={course} modules={modules} />;
}
