"use client";

import { useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseWatchStatisticsOptions {
  userId: string;
  lessonId: string;
  courseId: string;
}

interface StatisticsRef {
  totalWatchTime: number;
  playCount: number;
  pauseCount: number;
  seekCount: number;
  lastPlayTimestamp: number;
}

/**
 * Tracks play/pause/seek counts and total watch time.
 * Batch upserts to watch_statistics table.
 */
export function useWatchStatistics({
  userId,
  lessonId,
  courseId,
}: UseWatchStatisticsOptions) {
  const statsRef = useRef<StatisticsRef>({
    totalWatchTime: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    lastPlayTimestamp: 0,
  });

  const watchTimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const trackPlay = useCallback(() => {
    statsRef.current.playCount++;
    statsRef.current.lastPlayTimestamp = Date.now();

    // Start watch time tracking
    if (!watchTimeIntervalRef.current) {
      watchTimeIntervalRef.current = setInterval(() => {
        statsRef.current.totalWatchTime++;
      }, 1000);
    }
  }, []);

  const trackPause = useCallback(() => {
    statsRef.current.pauseCount++;

    // Stop watch time tracking
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }
  }, []);

  const trackSeek = useCallback(() => {
    statsRef.current.seekCount++;
  }, []);

  const flushStats = useCallback(async () => {
    if (!userId || !lessonId) return;

    const stats = statsRef.current;
    if (
      stats.totalWatchTime === 0 &&
      stats.playCount === 0 &&
      stats.pauseCount === 0 &&
      stats.seekCount === 0
    ) {
      return;
    }

    const supabase = createClient();
    await supabase.from("watch_statistics").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        total_watch_time_seconds: stats.totalWatchTime,
        play_count: stats.playCount,
        pause_count: stats.pauseCount,
        seek_count: stats.seekCount,
      },
      { onConflict: "user_id,lesson_id" }
    );
  }, [userId, lessonId, courseId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
      }
      // Best-effort flush on cleanup
      flushStats();
    };
  }, [flushStats]);

  return {
    trackPlay,
    trackPause,
    trackSeek,
    flushStats,
    getStats: () => ({ ...statsRef.current }),
  };
}
