"use client";

import { useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  enqueueFailedSave,
  sendBeaconProgress,
  processRetryQueue,
} from "@/lib/utils/progress-queue";

interface UseVideoProgressOptions {
  userId: string;
  lessonId: string;
  courseId: string;
}

export function useVideoProgress({
  userId,
  lessonId,
  courseId,
}: UseVideoProgressOptions) {
  const lastSaveRef = useRef<number>(0);

  // Process retry queue on mount
  useEffect(() => {
    processRetryQueue();
  }, []);

  // Register beforeunload handler for last-chance save
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!userId || !lessonId || !courseId) return;

      const payload = {
        userId,
        lessonId,
        courseId,
        progressSeconds: Math.floor(lastSaveRef.current),
      };
      sendBeaconProgress(payload);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, lessonId, courseId]);

  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!userId || !lessonId || !courseId) return;

      lastSaveRef.current = currentTime;
      const isCompleted = duration > 0 && currentTime / duration >= 0.9;

      const supabase = createClient();
      const { error } = await supabase.from("lesson_progress").upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          progress_seconds: Math.floor(currentTime),
          max_progress_seconds: Math.floor(currentTime),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

      if (error) {
        // Queue for retry on failure
        enqueueFailedSave({
          userId,
          lessonId,
          courseId,
          progressSeconds: Math.floor(currentTime),
          isCompleted,
        });
      }
    },
    [userId, lessonId, courseId]
  );

  const markComplete = useCallback(async () => {
    if (!userId || !lessonId || !courseId) return;

    const supabase = createClient();
    await supabase.from("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,lesson_id",
      }
    );

    // Also update enrollment last_lesson_id
    await supabase
      .from("enrollments")
      .update({ last_lesson_id: lessonId, last_accessed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }, [userId, lessonId, courseId]);

  return { saveProgress, markComplete };
}
