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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/formatters";
import type { Module, Lesson } from "@/types";

interface CourseSyllabusProps {
  modules: Module[];
}

const contentIcons: Record<string, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

export function CourseSyllabus({ modules }: CourseSyllabusProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.length > 0 ? [modules[0].id] : [])
  );

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold">{t("syllabus")}</h2>
        <span className="text-sm text-muted-foreground">
          {modules.length} {t("modules")} · {totalLessons} {t("lessons")} ·{" "}
          {formatDuration(totalDuration)}
        </span>
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
                    <LessonItem key={lesson.id} lesson={lesson} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonItem({ lesson, locale }: { lesson: Lesson; locale: string }) {
  const Icon = contentIcons[lesson.content_type] ?? FileText;
  const title =
    locale === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 ps-12">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{title}</span>
        {lesson.is_preview && (
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
            Preview
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {lesson.duration_minutes > 0 && (
          <span>{formatDuration(lesson.duration_minutes)}</span>
        )}
        {!lesson.is_preview && <Lock className="h-3 w-3" />}
      </div>
    </div>
  );
}
