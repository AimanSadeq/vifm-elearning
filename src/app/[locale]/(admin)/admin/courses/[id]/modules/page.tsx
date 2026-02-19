"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ModuleManager } from "@/components/admin/ModuleManager";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Module } from "@/types";

export default function CourseModulesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale();

  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch course title
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (course) setCourseTitle(course.title);

      // Fetch modules with lessons
      const { data: modulesData } = await supabase
        .from("modules")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true });

      if (modulesData) {
        const sorted = modulesData.map((mod) => ({
          ...mod,
          lessons: (mod.lessons ?? []).sort(
            (a: { sort_order: number }, b: { sort_order: number }) =>
              a.sort_order - b.sort_order
          ),
        }));
        setModules(sorted as Module[]);
      }

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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/courses`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          Back to Courses
        </Link>
        <h1 className="font-heading text-2xl font-bold">
          Modules & Lessons
        </h1>
        {courseTitle && (
          <p className="text-muted-foreground">{courseTitle}</p>
        )}
      </div>

      <ModuleManager courseId={courseId} initialModules={modules} />
    </div>
  );
}
