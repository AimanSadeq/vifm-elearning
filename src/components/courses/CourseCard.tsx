"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Users, ArrowRight, Star, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration } from "@/lib/utils/formatters";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  const title =
    (locale === "ar"
      ? course.title_ar || course.title
      : course.title || course.title_ar) ?? "";
  const description =
    locale === "ar" && course.short_description_ar
      ? course.short_description_ar
      : course.short_description;
  const categoryName =
    locale === "ar" && course.category?.name_ar
      ? course.category.name_ar
      : course.category?.name;
  const instructorName =
    locale === "ar" && course.instructor?.full_name_ar
      ? course.instructor.full_name_ar
      : course.instructor?.full_name;

  const difficultyColors: Record<string, string> = {
    gateway: "bg-success/10 text-success border-success/20",
    professional: "bg-info/10 text-info border-info/20",
    executive: "bg-warning/10 text-warning border-warning/20",
    expert: "bg-error/10 text-error border-error/20",
  };

  const hasRating = course.average_rating > 0;

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">
            <span className="font-heading text-5xl font-bold text-brand-300">
              {title.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay gradient for badge legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 via-black/10 to-transparent"
        />

        {/* Category (top-start) */}
        {categoryName && (
          <Badge
            className="absolute start-3 top-3 max-w-[70%] truncate border-0 bg-white/90 text-brand-900 shadow-sm backdrop-blur"
          >
            {categoryName}
          </Badge>
        )}

        {/* Featured / Free (top-end) */}
        {course.is_free ? (
          <Badge
            variant="success"
            className="absolute end-3 top-3 gap-1 shadow-sm"
          >
            {t("free")}
          </Badge>
        ) : course.is_featured ? (
          <Badge className="absolute end-3 top-3 gap-1 border-0 bg-amber-500 text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
            {locale === "ar" ? "مميز" : "Featured"}
          </Badge>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Difficulty */}
        <div className="mb-2 flex items-center gap-2 min-h-[1.25rem]">
          {course.difficulty_level && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                difficultyColors[course.difficulty_level] ?? ""
              }`}
            >
              {t(course.difficulty_level)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-foreground group-hover:text-brand-700 transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        {instructorName && (
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? `بقلم ${instructorName}` : `By ${instructorName}`}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star
              className={`h-3.5 w-3.5 ${
                hasRating
                  ? "fill-amber-500 text-amber-500"
                  : "text-muted-foreground/50"
              }`}
            />
            <span
              className={`font-medium ${
                hasRating ? "text-foreground" : "text-muted-foreground/70"
              }`}
            >
              {hasRating
                ? course.average_rating.toFixed(1)
                : locale === "ar"
                ? "جديد"
                : "New"}
            </span>
            {hasRating && (
              <span className="text-xs">({course.rating_count})</span>
            )}
          </div>

          {course.duration_hours != null && course.duration_hours > 0 && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(course.duration_hours * 60)}</span>
              </div>
            </>
          )}

          {course.enrollment_count > 0 && (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{course.enrollment_count.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Price row */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-baseline gap-1.5">
            {course.is_free ? (
              <span className="text-xl font-bold text-success">
                {t("free")}
              </span>
            ) : (
              <>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(course.price, course.currency, locale)}
                </span>
                {course.currency && (
                  <span className="text-xs text-muted-foreground">
                    {course.currency}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            {t("overview")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
