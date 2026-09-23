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

      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true });

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["super_admin", "instructor"])
        .eq("is_active", true);

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
