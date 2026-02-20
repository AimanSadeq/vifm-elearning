"use client";

import { useMemo } from "react";
import type { Module, LessonProgress } from "@/types";

interface UseSequentialLockingOptions {
  modules: Module[];
  progressMap: Record<string, LessonProgress>;
  enabled: boolean;
}

/**
 * Determines which lessons are locked based on Module>Lesson sort_order
 * and completion status. All lessons must be completed in sequence.
 * The first uncompleted lesson is unlocked; all subsequent ones are locked.
 */
export function useSequentialLocking({
  modules,
  progressMap,
  enabled,
}: UseSequentialLockingOptions) {
  const lockedLessonIds = useMemo(() => {
    if (!enabled) return new Set<string>();

    const locked = new Set<string>();
    let hitUncompleted = false;

    // Walk through all lessons in module/lesson sort order
    for (const mod of modules) {
      const lessons = mod.lessons ?? [];
      for (const lesson of lessons) {
        const progress = progressMap[lesson.id];
        const isCompleted = progress?.is_completed ?? false;

        if (hitUncompleted) {
          locked.add(lesson.id);
        } else if (!isCompleted) {
          // First uncompleted lesson — unlocked, but all after are locked
          hitUncompleted = true;
        }
      }
    }

    return locked;
  }, [modules, progressMap, enabled]);

  const isLocked = useMemo(
    () => (lessonId: string) => lockedLessonIds.has(lessonId),
    [lockedLessonIds]
  );

  const nextUnlockedLessonId = useMemo(() => {
    if (!enabled) return null;

    for (const mod of modules) {
      const lessons = mod.lessons ?? [];
      for (const lesson of lessons) {
        const progress = progressMap[lesson.id];
        if (!progress?.is_completed) {
          return lesson.id;
        }
      }
    }
    return null;
  }, [modules, progressMap, enabled]);

  return {
    lockedLessonIds,
    isLocked,
    nextUnlockedLessonId,
  };
}
