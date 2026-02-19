"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      const supabase = createClient();
      const isCompleted = duration > 0 && currentTime / duration >= 0.9;

      await supabase.from("lesson_progress").upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          progress_seconds: Math.floor(currentTime),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );
    },
    [userId, lessonId, courseId]
  );

  const markComplete = useCallback(async () => {
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
  }, [userId, lessonId, courseId]);

  return { saveProgress, markComplete };
}
