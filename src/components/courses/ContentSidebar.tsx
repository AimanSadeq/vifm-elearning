"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  Search,
  X,
  Lock,
  FileText,
  HelpCircle,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/formatters";
import { getDocumentMeta } from "@/lib/utils/document-meta";
import type { Course, Module, LessonProgress } from "@/types";

interface ContentSidebarProps {
  course: Course;
  modules: Module[];
  currentLessonId: string;
  progressMap: Record<string, LessonProgress>;
  overallProgress: number;
  lockedLessonIds: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  designationSlug?: string | null;
}

const contentTypeBadgeClass: Record<string, string> = {
  video: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  document: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  quiz: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  assignment: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const contentTypeLabelKey: Record<string, string> = {
  video: "typeVideo",
  document: "typeDoc",
  quiz: "typeQuiz",
  assignment: "typeTask",
};

export function ContentSidebar({
  course,
  modules,
  currentLessonId,
  progressMap,
  overallProgress,
  lockedLessonIds,
  searchQuery,
  onSearchChange,
  onClose,
  designationSlug,
}: ContentSidebarProps) {
  const locale = useLocale();
  const t = useTranslations("player");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const moduleId = modules.find((m) =>
      m.lessons?.some((l) => l.id === currentLessonId)
    )?.id;
    return new Set(moduleId ? [moduleId] : modules.map((m) => m.id));
  });

  const courseTitle =
    (locale === "ar"
      ? course.title_ar || course.title
      : course.title || course.title_ar) ?? "";

  // Filter lessons by search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;

    const query = searchQuery.toLowerCase().trim();
    return modules
      .map((mod) => {
        const filteredLessons = (mod.lessons ?? []).filter((lesson) => {
          const titleEn = lesson.title?.toLowerCase() ?? "";
          const titleAr = lesson.title_ar?.toLowerCase() ?? "";
          const type = lesson.content_type.toLowerCase();
          return (
            titleEn.includes(query) ||
            titleAr.includes(query) ||
            type.includes(query)
          );
        });

        if (filteredLessons.length === 0) return null;
        return { ...mod, lessons: filteredLessons };
      })
      .filter(Boolean) as Module[];
  }, [modules, searchQuery]);

  const getModuleProgress = (mod: Module) => {
    const lessons = mod.lessons ?? [];
    const completed = lessons.filter(
      (l) => progressMap[l.id]?.is_completed
    ).length;
    return { completed, total: lessons.length };
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold">{courseTitle}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {(() => {
              const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
              const completedLessons = modules
                .flatMap((m) => m.lessons ?? [])
                .filter((l) => progressMap[l.id]?.is_completed).length;
              return t("progressCount", { completed: completedLessons, total: totalLessons });
            })()}
          </span>
          <span className="font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Course Website Link */}
      {designationSlug && (
        <div className="border-b px-4 py-2.5">
          <Link
            href={`/${locale}/designations/${designationSlug}?tab=courseWebsite`}
            className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50">
              <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{t("courseWebsite")}</p>
              <p className="truncate text-[11px] font-normal text-brand-500 dark:text-brand-400/70">
                {t("courseWebsiteDesc")}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="border-b">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("searchLessons")}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showSearch && "rotate-180"
            )}
          />
        </button>

        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("searchLessons")}
                className="w-full rounded-lg border border-border bg-muted py-2 ps-9 pe-9 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("resultsFound", {
                  count: filteredModules.reduce(
                    (sum, m) => sum + (m.lessons?.length ?? 0),
                    0
                  ),
                })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Module/Lesson list */}
      <div className="flex-1 overflow-y-auto">
        {filteredModules.map((mod, mi) => {
          const isExpanded = expandedModules.has(mod.id);
          const moduleTitle =
            (locale === "ar"
              ? mod.title_ar || mod.title
              : mod.title || mod.title_ar) ?? "";
          const { completed, total } = getModuleProgress(mod);
          const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isComplete = completed === total && total > 0;

          return (
            <div key={mod.id} className="border-b last:border-0">
              <button
                onClick={() => toggleModule(mod.id)}
                aria-expanded={isExpanded}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-muted/50",
                  isComplete && "bg-green-50/50 dark:bg-green-950/10"
                )}
              >
                {/* Module number badge */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    isComplete
                      ? "bg-green-500 text-white"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {mi + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{moduleTitle}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isComplete ? "bg-green-500" : "bg-primary"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {completed}/{total}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded && mod.lessons && (
                <div className="space-y-0.5 bg-muted/30 px-2 py-1.5">
                  {mod.lessons.map((lesson, li) => {
                    const isActive = lesson.id === currentLessonId;
                    const progress = progressMap[lesson.id];
                    const isCompleted = progress?.is_completed;
                    const isLocked = lockedLessonIds.has(lesson.id);
                    const watchPct =
                      progress && lesson.video_duration_seconds
                        ? Math.round(
                            (progress.progress_seconds /
                              lesson.video_duration_seconds) *
                              100
                          )
                        : 0;
                    const isInProgress = watchPct > 0 && !isCompleted;
                    const lessonNumber = `${mi + 1}.${li + 1}`;
                    const lessonTitle =
                      locale === "ar"
                        ? lesson.title_ar || lesson.title || ""
                        : lesson.title || lesson.title_ar || "";
                    const badgeClass = contentTypeBadgeClass[lesson.content_type];
                    const badgeLabelKey = contentTypeLabelKey[lesson.content_type];
                    // For documents, prefer the actual file extension
                    // (XLSX/PDF/DOCX/...) over the generic "DOC" label.
                    const documentBadge =
                      lesson.content_type === "document"
                        ? getDocumentMeta(lesson.document_url, lesson.document_type).label
                        : null;

                    return (
                      <Link
                        key={lesson.id}
                        href={
                          isLocked
                            ? "#"
                            : `/${locale}/courses/${course.slug}/learn/${lesson.id}`
                        }
                        onClick={(e) => isLocked && e.preventDefault()}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                          isLocked && "cursor-not-allowed opacity-60",
                          isActive &&
                            "bg-primary/10 border border-primary/30 shadow-sm",
                          !isActive &&
                            !isLocked &&
                            "hover:bg-card hover:shadow-sm",
                          isCompleted &&
                            !isActive &&
                            "bg-green-50/50 dark:bg-green-950/20"
                        )}
                      >
                        {/* Lesson number */}
                        <div
                          className={cn(
                            "flex h-7 min-w-[2rem] px-1.5 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {lessonNumber}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm leading-snug line-clamp-2",
                              isActive
                                ? "font-semibold text-primary"
                                : "font-medium text-foreground"
                            )}
                          >
                            {lessonTitle}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {badgeClass && badgeLabelKey && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  badgeClass
                                )}
                              >
                                {lesson.content_type === "video" && (
                                  <Play className="h-2.5 w-2.5" />
                                )}
                                {documentBadge ?? t(badgeLabelKey)}
                              </span>
                            )}
                            {lesson.duration_minutes > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(lesson.duration_minutes)}
                              </span>
                            )}
                          </div>
                          {/* In-progress bar */}
                          {isInProgress && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900/50">
                                <div
                                  className="h-full rounded-full bg-amber-500"
                                  style={{ width: `${watchPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                {watchPct}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status icon */}
                        <div className="shrink-0">
                          {isLocked ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <Lock className="h-3 w-3" />
                            </div>
                          ) : isActive ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              {lesson.content_type === "document" ? (
                                <FileText className="h-3 w-3" />
                              ) : lesson.content_type === "quiz" ? (
                                <HelpCircle className="h-3 w-3" />
                              ) : (
                                <Play
                                  className="h-3 w-3 ms-0.5"
                                  fill="currentColor"
                                />
                              )}
                            </div>
                          ) : isCompleted ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          ) : isInProgress ? (
                            <div className="relative flex h-6 w-6 items-center justify-center">
                              <svg
                                className="h-6 w-6 -rotate-90"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  fill="none"
                                  className="text-amber-200 dark:text-amber-900/50"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  fill="none"
                                  strokeDasharray={`${(watchPct / 100) * 62.83} 62.83`}
                                  strokeLinecap="round"
                                  className="text-amber-500"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-border bg-card" />
                          )}
                        </div>

                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute -start-0.5 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-sm" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
