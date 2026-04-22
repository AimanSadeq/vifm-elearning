"use client";

import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { CourseCard } from "./CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/types";

interface FeaturedCoursesProps {
  courses: Course[];
  isLoading?: boolean;
}

export function FeaturedCourses({ courses, isLoading }: FeaturedCoursesProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  if (isLoading) {
    return (
      <section>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-700 px-3 py-1 text-xs font-medium mb-2">
            <Sparkles className="h-3 w-3" />
            {locale === "ar" ? "موصى به" : "Handpicked"}
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            {t("featured")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar"
              ? "أحدث وأكثر الدورات تميزاً في منصتنا"
              : "Our most-loved courses, curated by the team"}
          </p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.slice(0, 3).map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
