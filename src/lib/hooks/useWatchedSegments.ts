"use client";

import { useRef, useCallback } from "react";
import { WATCHED_SEGMENTS_COUNT } from "@/lib/utils/constants";

interface UseWatchedSegmentsOptions {
  duration: number; // video duration in seconds
  segmentCount?: number;
}

/**
 * Manages a boolean array of watched segments for granular video completion tracking.
 * Each segment represents an equal portion of the video.
 */
export function useWatchedSegments({
  duration,
  segmentCount = WATCHED_SEGMENTS_COUNT,
}: UseWatchedSegmentsOptions) {
  const segmentsRef = useRef<boolean[]>(
    Array.from({ length: segmentCount }, () => false)
  );

  /**
   * Mark the segment corresponding to the given currentTime.
   * Call this on every `timeupdate` event.
   */
  const markSegment = useCallback(
    (currentTime: number) => {
      if (duration <= 0) return;
      const index = Math.min(
        Math.floor((currentTime / duration) * segmentCount),
        segmentCount - 1
      );
      segmentsRef.current[index] = true;
    },
    [duration, segmentCount]
  );

  /**
   * Calculate completion percentage based on how many segments have been watched.
   */
  const getCompletionPercentage = useCallback(() => {
    const watched = segmentsRef.current.filter(Boolean).length;
    return segmentCount > 0 ? (watched / segmentCount) * 100 : 0;
  }, [segmentCount]);

  /**
   * Merge previously-saved segments from DB (OR logic — never regress).
   */
  const mergeSegments = useCallback(
    (savedSegments: boolean[]) => {
      const current = segmentsRef.current;
      const len = Math.max(current.length, savedSegments.length);
      segmentsRef.current = Array.from({ length: len }, (_, i) =>
        Boolean(current[i]) || Boolean(savedSegments[i])
      );

      // Ensure array stays at segmentCount length
      if (segmentsRef.current.length < segmentCount) {
        segmentsRef.current = [
          ...segmentsRef.current,
          ...Array.from(
            { length: segmentCount - segmentsRef.current.length },
            () => false
          ),
        ];
      } else if (segmentsRef.current.length > segmentCount) {
        segmentsRef.current = segmentsRef.current.slice(0, segmentCount);
      }
    },
    [segmentCount]
  );

  /**
   * Get a snapshot of the current segments array.
   */
  const getSegments = useCallback(() => [...segmentsRef.current], []);

  /**
   * Reset all segments to false.
   */
  const reset = useCallback(() => {
    segmentsRef.current = Array.from({ length: segmentCount }, () => false);
  }, [segmentCount]);

  return {
    markSegment,
    getCompletionPercentage,
    mergeSegments,
    getSegments,
    reset,
  };
}
