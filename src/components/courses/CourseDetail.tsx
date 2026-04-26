"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  Clock,
  Users,
  BarChart3,
  Globe,
  Award,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/StarRating";
import { CourseSyllabus } from "./CourseSyllabus";
import { CoursePricing } from "./CoursePricing";
import {
  formatDuration,
  formatDate,
  formatNumber,
} from "@/lib/utils/formatters";
import type { Course, Module } from "@/types";

interface CourseDetailProps {
  course: Course;
  modules: Module[];
}

export function CourseDetail({ course, modules }: CourseDetailProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  // If the course has only the *other* language filled in, fall back to it
  // rather than rendering null. This handles people landing on /en for an
  // Arabic-only course (which the catalog wouldn't link to, but URLs can be shared).
  const title =
    (locale === "ar" ? course.title_ar : course.title) ??
    course.title ??
    course.title_ar ??
    "(Untitled)";
  const description =
    locale === "ar" && course.description_ar
      ? course.description_ar
      : course.description;
  const categoryName =
    locale === "ar" && course.category?.name_ar
      ? course.category.name_ar
      : course.category?.name;
  const instructorName =
    locale === "ar" && course.instructor?.full_name_ar
      ? course.instructor.full_name_ar
      : course.instructor?.full_name;
  const learningOutcomes =
    locale === "ar" && course.learning_outcomes_ar?.length
      ? course.learning_outcomes_ar
      : course.learning_outcomes;

  const difficultyLabels: Record<string, string> = {
    beginner: t("beginner"),
    intermediate: t("intermediate"),
    advanced: t("advanced"),
    expert: t("expert"),
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-brand-900 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumbs */}
              <div className="mb-4 flex items-center gap-2 text-sm text-brand-200">
                {categoryName && <span>{categoryName}</span>}
                {course.difficulty_level && (
                  <>
                    <span>·</span>
                    <span>
                      {difficultyLabels[course.difficulty_level] ??
                        course.difficulty_level}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-heading text-3xl font-bold lg:text-4xl">
                {title}
              </h1>

              {description && (
                <p className="mt-4 text-lg text-brand-100">{description}</p>
              )}

              {/* Meta info */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                {course.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <StarRating rating={course.average_rating} size="sm" />
                    <span className="font-medium">
                      {course.average_rating.toFixed(1)}
                    </span>
                    <span className="text-brand-200">
                      ({formatNumber(course.rating_count, locale)} {t("reviews")})
                    </span>
                  </div>
                )}

                {course.enrollment_count > 0 && (
                  <div className="flex items-center gap-1.5 text-brand-200">
                    <Users className="h-4 w-4" />
                    <span>
                      {formatNumber(course.enrollment_count, locale)}{" "}
                      {t("students")}
                    </span>
                  </div>
                )}

                {course.duration_hours != null && course.duration_hours > 0 && (
                  <div className="flex items-center gap-1.5 text-brand-200">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.duration_hours * 60)}</span>
                  </div>
                )}

                {course.difficulty_level && (
                  <div className="flex items-center gap-1.5 text-brand-200">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      {difficultyLabels[course.difficulty_level] ??
                        course.difficulty_level}
                    </span>
                  </div>
                )}
              </div>

              {/* Instructor */}
              {instructorName && (
                <div className="mt-4 flex items-center gap-3">
                  {course.instructor?.avatar_url ? (
                    <Image
                      src={course.instructor.avatar_url}
                      alt={instructorName}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold">
                      {instructorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-brand-200">{t("instructor")}</p>
                    <p className="font-medium">{instructorName}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-brand-600 text-brand-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Published date */}
              {course.published_at && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-300">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("lastUpdated")} {formatDate(course.published_at, locale)}
                </p>
              )}
            </div>

            {/* Right: Pricing Card (desktop) */}
            <div className="hidden lg:block">
              <CoursePricing course={course} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Outcomes */}
            {learningOutcomes && learningOutcomes.length > 0 && (
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 font-heading text-xl font-bold">
                  {t("learningOutcomes")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {learningOutcomes.map((outcome, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <h2 className="mb-3 font-heading text-xl font-bold">
                  {t("prerequisites")}
                </h2>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {course.prerequisites.map((prereq, i) => (
                    <li key={i}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Syllabus */}
            {modules.length > 0 && (
              <CourseSyllabus modules={modules} courseSlug={course.slug} />
            )}

            {/* Course info row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoItem
                icon={Globe}
                label="Language"
                value="English & Arabic"
              />
              {course.certificate_enabled && (
                <InfoItem
                  icon={Award}
                  label="Certificate"
                  value="Included"
                />
              )}
              {course.passing_score > 0 && (
                <InfoItem
                  icon={BarChart3}
                  label="Passing Score"
                  value={`${course.passing_score}%`}
                />
              )}
            </div>
          </div>

          {/* Right: Pricing Card (mobile) */}
          <div className="lg:hidden">
            <CoursePricing course={course} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Icon className="h-5 w-5 text-brand-600" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
