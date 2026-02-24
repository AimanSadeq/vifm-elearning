"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Swipe-to-close for mobile sidebar
  const dragX = useMotionValue(0);
  const sidebarOpacity = useTransform(dragX, [-200, 0], [0, 1]);
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      // Close sidebar if dragged far enough or fast enough to the left (LTR) or right (RTL)
      const isRtl = document.documentElement.dir === "rtl";
      const threshold = 100;
      const velocityThreshold = 500;
      const offsetX = isRtl ? info.offset.x : -info.offset.x;
      const velocityX = isRtl ? info.velocity.x : -info.velocity.x;

      if (offsetX > threshold || velocityX > velocityThreshold) {
        setSidebarOpen(false);
      }
    },
    [setSidebarOpen]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "hidden md:flex flex-col border-e transition-all duration-300 overflow-hidden shrink-0",
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
      )}

      {/* Mobile Sidebar (full-screen overlay with swipe-to-close) */}
      {isMobile && (
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              {/* Sidebar panel */}
              <motion.aside
                initial={{ x: document.documentElement.dir === "rtl" ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: document.documentElement.dir === "rtl" ? "100%" : "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="x"
                dragConstraints={{ left: -200, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ opacity: sidebarOpacity }}
                className="fixed inset-y-0 start-0 z-50 w-[85vw] max-w-sm shadow-xl"
              >
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
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

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
        <div className={cn("p-4 sm:p-6", isTheaterMode && "px-0 pt-0 pb-6")}>
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
