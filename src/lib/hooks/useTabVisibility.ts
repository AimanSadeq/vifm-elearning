"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseTabVisibilityOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onHidden?: () => void;
  onVisible?: () => void;
  pauseOnHide?: boolean;
}

/**
 * Pauses video when tab is hidden; optionally resumes when visible.
 * Also saves progress on tab hide via the onHidden callback.
 */
export function useTabVisibility({
  videoRef,
  onHidden,
  onVisible,
  pauseOnHide = true,
}: UseTabVisibilityOptions) {
  const wasPlayingRef = useRef(false);

  const handleVisibilityChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.hidden) {
      wasPlayingRef.current = !video.paused;
      if (pauseOnHide && !video.paused) {
        video.pause();
      }
      onHidden?.();
    } else {
      onVisible?.();
    }
  }, [videoRef, onHidden, onVisible, pauseOnHide]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
}
