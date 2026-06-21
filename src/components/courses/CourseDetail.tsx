"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Star,
  Video,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

interface DifficultyMeta {
  label: string;
  ribbonClasses: string;
  stripeClasses: string;
  pillClasses: string;
}

function getDifficultyMeta(
  level: string | null | undefined,
  labelMap: Record<string, string>
): DifficultyMeta {
  // Difficulty tones map to VIFM brand-blue intensity progression — lighter
  // brand for beginner, deepest for expert. Keeps the page on-brand while
  // still giving each level a visually distinct ribbon.
  switch (level) {
    case "beginner":
      return {
        label: labelMap.beginner ?? "Beginner",
        ribbonClasses: "from-brand-300/30 via-transparent",
        stripeClasses: "from-brand-300 to-brand-500",
        pillClasses: "border-brand-200/60 bg-brand-300/15 text-brand-50",
      };
    case "intermediate":
      return {
        label: labelMap.intermediate ?? "Intermediate",
        ribbonClasses: "from-brand-400/30 via-transparent",
        stripeClasses: "from-brand-400 to-brand-600",
        pillClasses: "border-brand-300/60 bg-brand-400/15 text-brand-100",
      };
    case "advanced":
      return {
        label: labelMap.advanced ?? "Advanced",
        ribbonClasses: "from-brand-600/40 via-transparent",
        stripeClasses: "from-brand-600 to-brand-800",
        pillClasses: "border-brand-400/60 bg-brand-500/20 text-brand-100",
      };
    case "expert":
      return {
        label: labelMap.expert ?? "Expert",
        ribbonClasses: "from-brand-800/40 via-transparent",
        stripeClasses: "from-brand-800 to-brand-950",
        pillClasses: "border-brand-500/60 bg-brand-700/30 text-brand-50",
      };
    default:
      return {
        label: level ?? "",
        ribbonClasses: "from-brand-500/30 via-transparent",
        stripeClasses: "from-brand-500 to-brand-700",
        pillClasses: "border-brand-300/60 bg-brand-400/15 text-brand-100",
      };
  }
}

export function CourseDetail({ course, modules }: CourseDetailProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  // First video lesson flagged as a free preview — powers the "Watch Demo"
  // CTA. Null when the course has no preview video, which hides the button.
  const previewLesson =
    modules
      .flatMap((m) => m.lessons ?? [])
      .find((l) => l.is_preview && l.content_type === "video") ?? null;

  // Bilingual fallbacks: prefer locale's value, fall back to the other language
  // so AR-only courses render in EN locale and vice versa.
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
  const difficulty = getDifficultyMeta(course.difficulty_level, difficultyLabels);

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);

  // Section index keeps numbered headings in order whether or not optional
  // sections (prerequisites, syllabus) are present.
  let sectionIndex = 0;
  const nextIndex = () => String(++sectionIndex).padStart(2, "0");

  return (
    <div className="bg-background">
      {/* ============================================================
          HERO — gradient mesh on dark, with a featured glance tile
          ============================================================ */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${difficulty.ribbonClasses} to-transparent`}
        />
        <div
          aria-hidden
          className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />

        <div className="container mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
          {/* Eyebrow + difficulty pill */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
              <span className="hidden sm:inline">VIFM</span>
              <span className="hidden h-px w-8 bg-white/20 sm:block" />
              <span>{categoryName ?? t("catalog")}</span>
            </div>
            {course.difficulty_level && (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${difficulty.pillClasses}`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {difficulty.label}
              </div>
            )}
          </div>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            {/* Left — title + description + instructor + tags */}
            <div className="lg:col-span-8">
              <h1
                className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]"
                dir={locale === "ar" ? "rtl" : undefined}
              >
                <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>

              {description && (
                <p
                  className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
                  dir={locale === "ar" ? "rtl" : undefined}
                >
                  {description}
                </p>
              )}

              {/* Instructor */}
              {instructorName && (
                <div className="mt-8 flex items-center gap-4">
                  {course.instructor?.avatar_url ? (
                    // Stable URL on Supabase storage; let Next.js optimise it.
                    <Image
                      src={course.instructor.avatar_url}
                      alt={instructorName}
                      width={52}
                      height={52}
                      className="h-13 w-13 rounded-full ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-base font-bold ring-2 ring-white/20">
                      {instructorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                      {t("instructor")}
                    </p>
                    <p
                      className="text-base font-semibold"
                      dir={locale === "ar" ? "rtl" : undefined}
                    >
                      {instructorName}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Last updated */}
              {course.published_at && (
                <p className="mt-6 text-[11px] uppercase tracking-[0.15em] text-white/40">
                  {t("lastUpdated")} · {formatDate(course.published_at, locale)}
                </p>
              )}
            </div>

            {/* Right — featured "At a glance" tile */}
            <div className="lg:col-span-4">
              <div className="relative">
                <div
                  aria-hidden
                  className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${difficulty.stripeClasses} opacity-30 blur-2xl`}
                />
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
                  <div className="p-6">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                      {t("atAGlance")}
                    </p>

                    {/* Hours hero stat */}
                    {course.duration_hours != null && course.duration_hours > 0 ? (
                      <div className="mt-2">
                        <p className="font-heading text-5xl font-bold leading-none">
                          {Number.isInteger(course.duration_hours)
                            ? course.duration_hours
                            : course.duration_hours.toFixed(1)}
                          <span className="ms-1 text-2xl font-semibold text-white/60">
                            {t("hours")}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {t("ofExpertContent")}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 font-heading text-3xl font-bold">
                        {totalLessons}{" "}
                        <span className="text-base font-semibold text-white/60">
                          {t("lessons")}
                        </span>
                      </p>
                    )}

                    {/* Stat strip — rating + students + lessons */}
                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                      {course.average_rating > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                            {t("rating")}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {course.average_rating.toFixed(1)}
                            <span className="text-white/50">
                              ({formatNumber(course.rating_count, locale)})
                            </span>
                          </p>
                        </div>
                      )}
                      {course.enrollment_count > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                            {t("students")}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {formatNumber(course.enrollment_count, locale)}
                          </p>
                        </div>
                      )}
                      {modules.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                            {t("modules")}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {modules.length}
                          </p>
                        </div>
                      )}
                      {totalLessons > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                            {t("lessons")}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {totalLessons}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BODY
          ============================================================ */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-12 lg:col-span-2">
            {/* Learning outcomes */}
            {learningOutcomes && learningOutcomes.length > 0 && (
              <Section index={nextIndex()} title={t("whatYoullMaster")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {learningOutcomes.map((outcome, i) => (
                    <Benefit
                      key={i}
                      label={outcome}
                      Icon={CheckCircle2}
                      highlight={i === 0}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Curriculum / syllabus */}
            {modules.length > 0 && (
              <Section index={nextIndex()} title={t("curriculum")}>
                <CourseSyllabus modules={modules} courseSlug={course.slug} />
              </Section>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Section index={nextIndex()} title={t("prerequisites")}>
                <Card>
                  <CardContent className="p-6">
                    <ul className="space-y-2 text-sm">
                      {course.prerequisites.map((prereq, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          <span className="text-muted-foreground">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Details info row */}
            <Section index={nextIndex()} title={t("details")}>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  Icon={Globe}
                  label={t("language")}
                  value={t("languageValue")}
                />
                {course.certificate_enabled && (
                  <InfoCard
                    Icon={Award}
                    label={t("certificate")}
                    value={t("certificateIncluded")}
                  />
                )}
                {course.passing_score > 0 && (
                  <InfoCard
                    Icon={GraduationCap}
                    label={t("passingScore")}
                    value={`${course.passing_score}%`}
                  />
                )}
                {course.duration_hours != null && course.duration_hours > 0 && (
                  <InfoCard
                    Icon={Clock}
                    label={t("duration")}
                    value={formatDuration(course.duration_hours * 60)}
                  />
                )}
                {course.difficulty_level && (
                  <InfoCard
                    Icon={BarChart3}
                    label={t("level")}
                    value={difficulty.label}
                  />
                )}
                {totalLessons > 0 && (
                  <InfoCard
                    Icon={Video}
                    label={t("lessons")}
                    value={String(totalLessons)}
                  />
                )}
              </div>
            </Section>
          </div>

          {/* Right rail — pricing card */}
          <aside className="lg:col-span-1">
            <CoursePricing course={course} previewLesson={previewLesson} />
          </aside>
        </div>
      </section>
    </div>
  );
}

// ----------------- helper components -----------------

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-heading text-sm font-medium text-brand-600/80 tabular-nums">
          {index}
        </span>
        <span className="h-px w-6 bg-border" />
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Benefit({
  label,
  Icon,
  highlight = false,
}: {
  label: string;
  Icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative flex items-start gap-4 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "border-brand-200 bg-gradient-to-br from-brand-50 to-transparent dark:border-brand-900/40 dark:from-brand-950/30"
          : "bg-card"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          highlight
            ? "bg-brand-600 text-white"
            : "bg-brand-50 text-brand-600 dark:bg-brand-950/40"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="pt-1.5 text-sm font-medium leading-relaxed">{label}</p>
    </div>
  );
}

function InfoCard({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

