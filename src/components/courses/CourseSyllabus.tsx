"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Lock,
  PlayIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/formatters";
import type { Module, Lesson } from "@/types";
import { LessonPreviewDialog } from "./LessonPreviewDialog";

interface CourseSyllabusProps {
  modules: Module[];
  /** Course slug — used by the preview dialog's CTA links */
  courseSlug?: string;
}

const contentIcons: Record<string, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

export function CourseSyllabus({ modules, courseSlug }: CourseSyllabusProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.length > 0 ? [modules[0].id] : [])
  );
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const totalLessons = modules.reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0
  );
  const totalDuration = modules.reduce(
    (sum, m) => sum + m.duration_minutes,
    0
  );
  const previewCount = modules.reduce(
    (sum, m) =>
      sum + (m.lessons?.filter((l) => l.is_preview).length ?? 0),
    0
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading text-xl font-bold">{t("syllabus")}</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {previewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[11px] font-semibold">
              <PlayIcon className="h-3 w-3" />
              {previewCount}{" "}
              {locale === "ar"
                ? previewCount === 1
                  ? "معاينة"
                  : "معاينات"
                : previewCount === 1
                  ? "preview"
                  : "previews"}
            </span>
          )}
          <span>
            {modules.length} {t("modules")} · {totalLessons} {t("lessons")} ·{" "}
            {formatDuration(totalDuration)}
          </span>
        </div>
      </div>

      <div className="divide-y rounded-lg border">
        {modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleTitle =
            locale === "ar" && module.title_ar ? module.title_ar : module.title;

          return (
            <div key={module.id}>
              {/* Module Header */}
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-start hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Module {index + 1}
                    </span>
                    <p className="font-medium">{moduleTitle}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {module.lessons?.length ?? 0} {t("lessons")} ·{" "}
                  {formatDuration(module.duration_minutes)}
                </span>
              </button>

              {/* Lessons */}
              {isExpanded && module.lessons && (
                <div className="border-t bg-muted/30">
                  {module.lessons.map((lesson) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      locale={locale}
                      onPreview={() => setPreviewLesson(lesson)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <LessonPreviewDialog
        lesson={previewLesson}
        courseSlug={courseSlug ?? ""}
        open={previewLesson !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewLesson(null);
        }}
      />
    </div>
  );
}

function LessonItem({
  lesson,
  locale,
  onPreview,
}: {
  lesson: Lesson;
  locale: string;
  onPreview: () => void;
}) {
  const Icon = contentIcons[lesson.content_type] ?? FileText;
  const title =
    locale === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title;

  // Preview lessons are clickable; locked ones are not
  if (lesson.is_preview) {
    return (
      <button
        type="button"
        onClick={onPreview}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 ps-12 text-start hover:bg-brand-50/50 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-4 w-4 shrink-0 text-brand-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm truncate group-hover:text-brand-700 transition-colors">
            {title}
          </span>
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600 shrink-0">
            {locale === "ar" ? "معاينة" : "Preview"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {lesson.duration_minutes > 0 && (
            <span>{formatDuration(lesson.duration_minutes)}</span>
          )}
          <span className="font-medium text-brand-600 group-hover:underline">
            {locale === "ar" ? "تشغيل ←" : "Play →"}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 ps-12">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm truncate">{title}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        {lesson.duration_minutes > 0 && (
          <span>{formatDuration(lesson.duration_minutes)}</span>
        )}
        <Lock className="h-3 w-3" />
      </div>
    </div>
  );
}
