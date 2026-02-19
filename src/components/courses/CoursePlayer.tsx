"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronDown,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/formatters";
import type { Course, Module, LessonProgress } from "@/types";

interface CoursePlayerProps {
  course: Course;
  modules: Module[];
  currentLessonId: string;
  progressMap: Record<string, LessonProgress>;
  overallProgress: number;
  children: React.ReactNode;
}

const contentIcons: Record<string, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

export function CoursePlayer({
  course,
  modules,
  currentLessonId,
  progressMap,
  overallProgress,
  children,
}: CoursePlayerProps) {
  const locale = useLocale();
  const t = useTranslations("courses");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expand the module containing current lesson
    const moduleId = modules.find((m) =>
      m.lessons?.some((l) => l.id === currentLessonId)
    )?.id;
    return new Set(moduleId ? [moduleId] : []);
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const courseTitle =
    locale === "ar" && course.title_ar ? course.title_ar : course.title;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-e bg-background transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-80" : "w-0"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/${locale}/courses/${course.slug}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
              Back to course
            </Link>
            <h2 className="mt-1 truncate text-sm font-semibold">
              {courseTitle}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{t("overview")}</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Module/Lesson list */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((mod, mi) => {
            const isExpanded = expandedModules.has(mod.id);
            const moduleTitle =
              locale === "ar" && mod.title_ar ? mod.title_ar : mod.title;

            return (
              <div key={mod.id} className="border-b last:border-0">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-start hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Module {mi + 1}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {moduleTitle}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && mod.lessons && (
                  <div className="pb-1">
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === currentLessonId;
                      const progress = progressMap[lesson.id];
                      const isCompleted = progress?.is_completed;
                      const Icon = contentIcons[lesson.content_type] ?? FileText;
                      const lessonTitle =
                        locale === "ar" && lesson.title_ar
                          ? lesson.title_ar
                          : lesson.title;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/${locale}/courses/${course.slug}/learn/${lesson.id}`}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-brand-50 text-brand-700 font-medium"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          ) : (
                            <Icon className="h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{lessonTitle}</span>
                          {lesson.duration_minutes > 0 && (
                            <span className="text-[10px]">
                              {formatDuration(lesson.duration_minutes)}
                            </span>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="fixed start-2 top-20 z-10 h-8 w-8 p-0 bg-background shadow-md border"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
