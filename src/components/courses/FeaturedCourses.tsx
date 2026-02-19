"use client";

import { useTranslations } from "next-intl";
import { CourseCard } from "./CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/types";

interface FeaturedCoursesProps {
  courses: Course[];
  isLoading?: boolean;
}

export function FeaturedCourses({ courses, isLoading }: FeaturedCoursesProps) {
  const t = useTranslations("courses");

  if (isLoading) {
    return (
      <section>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 font-heading text-2xl font-bold">{t("featured")}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
