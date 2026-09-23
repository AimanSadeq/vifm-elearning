"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CourseEditor } from "@/components/admin/CourseEditor";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Toaster } from "sonner";
import type { Course, Module, Lesson, Category } from "@/types";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<(Module & { lessons: Lesson[] })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; full_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch course with relations
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(
          `*, category:categories(name, name_ar, slug), instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)`
        )
        .eq("id", courseId)
        .single();

      // Modules + lessons come from the admin API, not from PostgREST.
      // `lessons` is no longer SELECT-able by `authenticated`, and an embed
      // needs the privilege on the embedded table too, so the direct query
      // returned "permission denied for table lessons".
      const curriculumRes = await fetch(`/api/admin/courses/${courseId}/curriculum`);
      const curriculumJson = curriculumRes.ok ? await curriculumRes.json() : null;
      const modulesData: (Module & { lessons: Lesson[] })[] | null =
          curriculumJson?.modules ?? null;
      const modulesError = curriculumRes.ok
        ? null
        : { message: curriculumJson?.error ?? `Could not load the curriculum (${curriculumRes.status})`, code: "ADMIN_API" };

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      // Instructors likewise: `role` and `is_active` are not granted to
      // `authenticated`, and PostgREST needs the privilege to FILTER on a
      // column, not just to return it.
      const instructorsRes = await fetch(
        "/api/admin/profiles?roles=super_admin,instructor&isActive=true&pageSize=200"
      );
      const instructorsJson = instructorsRes.ok ? await instructorsRes.json() : null;
      const instructorsData = instructorsJson?.rows ?? null;
      const instructorsError = instructorsRes.ok
        ? null
        : { message: instructorsJson?.error ?? `Could not load instructors (${instructorsRes.status})`, code: "ADMIN_API" };

      // A failed read must not look like an empty course, or admins may
      // re-create content that still exists.
      const firstError =
        courseError || modulesError || categoriesError || instructorsError;
      if (firstError && firstError.code !== "PGRST116") {
        console.error("Failed to load course editor data", firstError);
        setLoadError(firstError.message);
        setIsLoading(false);
        return;
      }

      if (courseData) {
        setCourse(courseData as Course);
      }

      if (modulesData) {
        // Sort lessons within each module
        const sorted = modulesData.map((m) => ({
          ...m,
          lessons: (m.lessons || []).sort(
            (a: Lesson, b: Lesson) => a.sort_order - b.sort_order
          ),
        })) as (Module & { lessons: Lesson[] })[];
        setModules(sorted);
      }

      setCategories((categoriesData as Category[]) || []);
      setInstructors(instructorsData || []);
      setIsLoading(false);
    }

    if (courseId) fetchData();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <p className="font-medium text-destructive">Could not load this course.</p>
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <CourseEditor
        course={course}
        modules={modules}
        categories={categories}
        instructors={instructors}
      />
    </>
  );
}
