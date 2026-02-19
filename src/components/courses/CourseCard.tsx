"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/StarRating";
import { formatCurrency, formatDuration } from "@/lib/utils/formatters";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  const title = locale === "ar" && course.title_ar ? course.title_ar : course.title;
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
    beginner: "bg-success/10 text-success",
    intermediate: "bg-info/10 text-info",
    advanced: "bg-warning/10 text-warning",
    expert: "bg-error/10 text-error",
  };

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className="group block overflow-hidden rounded-xl border bg-card transition-all hover:shadow-card-hover"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-50 text-brand-300">
            <span className="text-4xl font-bold">{title.charAt(0)}</span>
          </div>
        )}

        {/* Category badge overlay */}
        {categoryName && (
          <Badge className="absolute start-3 top-3 bg-background/90 text-foreground backdrop-blur-sm">
            {categoryName}
          </Badge>
        )}

        {/* Free badge */}
        {course.is_free && (
          <Badge variant="success" className="absolute end-3 top-3">
            {t("free")}
          </Badge>
        )}

        {/* Featured badge */}
        {course.is_featured && !course.is_free && (
          <Badge className="absolute end-3 top-3 bg-accent-500 text-white">
            Featured
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Difficulty + Category */}
        <div className="mb-2 flex items-center gap-2">
          {course.difficulty_level && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                difficultyColors[course.difficulty_level] ?? ""
              }`}
            >
              {t(course.difficulty_level)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground group-hover:text-brand-600 transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        {instructorName && (
          <p className="mt-1 text-sm text-muted-foreground">{instructorName}</p>
        )}

        {/* Description */}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Rating + Meta */}
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          {course.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={course.average_rating} size="sm" />
              <span className="font-medium text-foreground">
                {course.average_rating.toFixed(1)}
              </span>
              <span>({course.rating_count})</span>
            </div>
          )}

          {course.duration_hours != null && course.duration_hours > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(course.duration_hours * 60)}</span>
            </div>
          )}

          {course.enrollment_count > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{course.enrollment_count}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-lg font-bold text-foreground">
            {course.is_free
              ? t("free")
              : formatCurrency(course.price, course.currency, locale)}
          </span>
          <span className="text-sm font-medium text-brand-600 group-hover:underline">
            {t("overview")} →
          </span>
        </div>
      </div>
    </Link>
  );
}
