"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CATEGORIES } from "@/lib/utils/constants";
import type { Category, Course } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations("common");

  const [category, setCategory] = useState<Category | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get static category info as fallback
  const staticCat = CATEGORIES.find((c) => c.slug === slug);

  useEffect(() => {
    async function fetchCategory() {
      const supabase = createClient();

      // Fetch category
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (catData) {
        setCategory(catData as Category);

        // Fetch courses in this category
        const { data: coursesData } = await supabase
          .from("courses")
          .select(
            `
            *,
            category:categories(id, name, name_ar, slug, color),
            instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
          `
          )
          .eq("category_id", catData.id)
          .eq("status", "published")
          .order("published_at", { ascending: false });

        setCourses((coursesData as Course[]) ?? []);
      }

      setIsLoading(false);
    }

    if (slug) fetchCategory();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const categoryName =
    locale === "ar"
      ? category?.name_ar ?? staticCat?.nameAr ?? slug
      : category?.name ?? staticCat?.name ?? slug;

  const categoryDescription =
    locale === "ar" ? category?.description_ar : category?.description;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/courses`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {t("back")} to {t("courses")}
      </Link>

      {/* Category Header */}
      <div
        className="mb-8 rounded-xl p-8"
        style={{
          backgroundColor:
            (category?.color ?? staticCat?.color ?? "#1E3A5F") + "15",
        }}
      >
        <h1 className="font-heading text-3xl font-bold">{categoryName}</h1>
        {categoryDescription && (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {categoryDescription}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {courses.length} {t("courses").toLowerCase()}
        </p>
      </div>

      {/* Course Grid */}
      <CourseGrid courses={courses} isLoading={false} />
    </div>
  );
}
