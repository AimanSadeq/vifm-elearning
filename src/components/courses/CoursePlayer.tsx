"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ContentSidebar } from "./ContentSidebar";
import { CourseCompletionCelebration, useCelebration } from "./CourseCompletionCelebration";
import { useCoursePlayerStore } from "@/stores/course-player-store";
import type { Course, Module, LessonProgress } from "@/types";

interface CoursePlayerProps {
  course: Course;
  modules: Module[];
  currentLessonId: string;
  progressMap: Record<string, LessonProgress>;
  overallProgress: number;
  lockedLessonIds?: Set<string>;
  children: React.ReactNode;
}

export function CoursePlayer({
  course,
  modules,
  currentLessonId,
  progressMap,
  overallProgress,
  lockedLessonIds = new Set(),
  children,
}: CoursePlayerProps) {
  const {
    isSidebarOpen,
    setSidebarOpen,
    sidebarSearchQuery,
    setSidebarSearchQuery,
    isTheaterMode,
  } = useCoursePlayerStore();

  const { celebrationData, closeCelebration } = useCelebration();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-e transition-all duration-300 overflow-hidden shrink-0",
          isSidebarOpen ? "w-80" : "w-0"
        )}
      >
        {isSidebarOpen && (
          <ContentSidebar
            course={course}
            modules={modules}
            currentLessonId={currentLessonId}
            progressMap={progressMap}
            overallProgress={overallProgress}
            lockedLessonIds={lockedLessonIds}
            searchQuery={sidebarSearchQuery}
            onSearchChange={setSidebarSearchQuery}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 overflow-y-auto",
          isTheaterMode && "bg-black"
        )}
      >
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="fixed start-2 top-20 z-10 h-8 w-8 p-0 bg-background shadow-md border"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div className={cn("p-6", isTheaterMode && "px-0 pt-0 pb-6")}>
          {children}
        </div>
      </main>

      {/* Celebration overlay */}
      <CourseCompletionCelebration
        isOpen={celebrationData.isOpen}
        onClose={closeCelebration}
        courseName={celebrationData.courseName}
        completionPercentage={celebrationData.completionPercentage}
        certificateEarned={celebrationData.certificateEarned}
        certificateId={celebrationData.certificateId}
        examPassed={celebrationData.examPassed}
        examScore={celebrationData.examScore}
        nextCourseSlug={celebrationData.nextCourseSlug}
        nextCourseName={celebrationData.nextCourseName}
      />
    </div>
  );
}
