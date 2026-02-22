"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  SkipForward,
  Loader,
  AlertCircle,
  RefreshCw,
  Keyboard,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import {
  VIDEO_PROGRESS_INTERVAL,
  VIDEO_COMPLETION_THRESHOLD,
  VIDEO_MAX_RESTRICTED_SPEED,
  VIDEO_AUTOPLAY_COUNTDOWN_SECONDS,
  VIDEO_BOOKMARK_COLORS,
} from "@/lib/utils/constants";
import { monitorDevTools } from "@/lib/utils/devtools-detection";
import { useHlsPlayer } from "@/lib/hooks/useHlsPlayer";
import { useTabVisibility } from "@/lib/hooks/useTabVisibility";
import { QualitySelector } from "./QualitySelector";
import { CaptionsSelector } from "./CaptionsSelector";
import type { Bookmark as BookmarkItem } from "@/types";

interface VideoPlayerProps {
  src: string;
  hlsSrc?: string | null;
  poster?: string | null;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  captionsEnUrl?: string | null;
  captionsArUrl?: string | null;
  bookmarks?: BookmarkItem[];
  onSeekTo?: React.MutableRefObject<((seconds: number) => void) | null>;
  restrictSpeed?: boolean;
  isTheaterMode?: boolean;
  onTheaterToggle?: () => void;
  nextLesson?: { title: string; onPlay: () => void } | null;
  onTimeUpdate?: (seconds: number) => void;
  // Watched segments integration
  watchedSegments?: boolean[];
  onSegmentUpdate?: (currentTime: number) => void;
  // Per-lesson config props
  allowSkipping?: boolean;
  isFirstWatch?: boolean;
  minimumWatchPercentage?: number;
  autoSaveIntervalSeconds?: number;
  // Callback props for watch statistics
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const RESTRICTED_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

export function VideoPlayer({
  src,
  hlsSrc,
  poster,
  onProgress,
  onComplete,
  initialTime = 0,
  captionsEnUrl,
  captionsArUrl,
  bookmarks = [],
  onSeekTo,
  restrictSpeed = false,
  isTheaterMode = false,
  onTheaterToggle,
  nextLesson,
  onTimeUpdate,
  watchedSegments,
  onSegmentUpdate,
  allowSkipping = true,
  isFirstWatch = false,
  minimumWatchPercentage,
  autoSaveIntervalSeconds,
  onPlay: onPlayCallback,
  onPause: onPauseCallback,
  onSeek: onSeekCallback,
}: VideoPlayerProps) {
  const t = useTranslations("player");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTriggered = useRef(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track max watched position for seek restriction
  const maxWatchedPosition = useRef(initialTime);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("videoPlayerSpeed");
      return saved ? parseFloat(saved) : 1;
    }
    return 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captionLanguage, setCaptionLanguage] = useState<"off" | "en" | "ar">("off");
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  // Keyboard shortcuts panel
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Visual feedback overlays
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(false);
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const volumeOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Double-tap detection for mobile
  const lastTapTimeRef = useRef(0);
  const lastTapXRef = useRef(0);

  // Auto-play next state
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(VIDEO_AUTOPLAY_COUNTDOWN_SECONDS);

  // Determine completion threshold: per-lesson config or fallback
  const completionThreshold =
    minimumWatchPercentage != null
      ? minimumWatchPercentage / 100
      : VIDEO_COMPLETION_THRESHOLD;

  // Determine auto-save interval
  const saveInterval =
    autoSaveIntervalSeconds != null
      ? autoSaveIntervalSeconds * 1000
      : VIDEO_PROGRESS_INTERVAL;

  // Seek restriction: on first watch when skipping is not allowed, clamp forward seek
  const seekRestricted = isFirstWatch && !allowSkipping;

  // Initialize max watched position from watchedSegments if available
  useEffect(() => {
    if (watchedSegments && watchedSegments.length > 0 && duration > 0) {
      // Find the last watched segment to set max watched position
      let lastWatched = 0;
      for (let i = watchedSegments.length - 1; i >= 0; i--) {
        if (watchedSegments[i]) {
          lastWatched = ((i + 1) / watchedSegments.length) * duration;
          break;
        }
      }
      maxWatchedPosition.current = Math.max(
        maxWatchedPosition.current,
        lastWatched
      );
    }
  }, [watchedSegments, duration]);

  // HLS integration
  const {
    qualityLevels,
    currentQualityIndex,
    setQualityLevel,
  } = useHlsPlayer({
    videoRef,
    hlsUrl: hlsSrc ?? null,
    fallbackUrl: src,
  });

  // Tab visibility — pause on tab hidden, save progress
  useTabVisibility({
    videoRef,
    pauseOnHide: true,
    onHidden: () => {
      const video = videoRef.current;
      if (video && video.currentTime > 0 && video.duration > 0) {
        onProgress?.(video.currentTime, video.duration);
      }
    },
  });

  // DevTools detection (warn only)
  useEffect(() => {
    return monitorDevTools(
      () => {
        setDevtoolsOpen(true);
        videoRef.current?.pause();
      },
      () => setDevtoolsOpen(false)
    );
  }, []);

  // Expose seekTo via ref (with seek restriction)
  useEffect(() => {
    if (onSeekTo) {
      onSeekTo.current = (seconds: number) => {
        if (videoRef.current) {
          if (seekRestricted) {
            videoRef.current.currentTime = Math.min(
              seconds,
              maxWatchedPosition.current
            );
          } else {
            videoRef.current.currentTime = seconds;
          }
        }
      };
    }
    return () => {
      if (onSeekTo) onSeekTo.current = null;
    };
  }, [onSeekTo, seekRestricted]);

  // Set initial src for non-HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hlsSrc) return;
    video.src = src;
    if (initialTime > 0) {
      video.currentTime = initialTime;
    }
  }, [src, hlsSrc, initialTime]);

  // Restore position after HLS manifest parsed
  useEffect(() => {
    if (!hlsSrc || initialTime <= 0) return;
    const video = videoRef.current;
    if (!video) return;

    const tryRestore = () => {
      if (video.duration > 0 && initialTime > 0) {
        video.currentTime = Math.min(initialTime, video.duration - 1);
      }
    };

    if (video.readyState >= 1) tryRestore();
    video.addEventListener("loadedmetadata", tryRestore);
    return () => video.removeEventListener("loadedmetadata", tryRestore);
  }, [hlsSrc, initialTime]);

  // Progress tracking (uses per-lesson auto-save interval)
  useEffect(() => {
    if (isPlaying && onProgress) {
      progressInterval.current = setInterval(() => {
        const video = videoRef.current;
        if (video) {
          onProgress(video.currentTime, video.duration);
        }
      }, saveInterval);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, onProgress, saveInterval]);

  // Playback rate enforcement
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const maxSpeed = restrictSpeed ? VIDEO_MAX_RESTRICTED_SPEED : 2;
    if (video.playbackRate > maxSpeed) {
      video.playbackRate = maxSpeed;
      setPlaybackSpeed(maxSpeed);
    } else {
      video.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, restrictSpeed]);

  // MutationObserver to protect playback rate from console manipulation
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "playbackRate") {
          const maxSpeed = restrictSpeed ? VIDEO_MAX_RESTRICTED_SPEED : 2;
          if (video.playbackRate > maxSpeed) {
            video.playbackRate = maxSpeed;
          }
        }
      }
    });
    observer.observe(video, { attributes: true });
    return () => observer.disconnect();
  }, [restrictSpeed]);

  // Caption tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const existingTracks = video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    if (captionsEnUrl) {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = "English";
      track.srclang = "en";
      track.src = captionsEnUrl;
      track.default = captionLanguage === "en";
      video.appendChild(track);
    }

    if (captionsArUrl) {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = "Arabic";
      track.srclang = "ar";
      track.src = captionsArUrl;
      track.default = captionLanguage === "ar";
      video.appendChild(track);
    }
  }, [captionsEnUrl, captionsArUrl, captionLanguage]);

  // Manage caption track modes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (captionLanguage === "off") {
        track.mode = "hidden";
      } else {
        track.mode = track.language === captionLanguage ? "showing" : "hidden";
      }
    }
  }, [captionLanguage]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      onPlayCallback?.();
    } else {
      video.pause();
      setIsPlaying(false);
      onPauseCallback?.();
    }
  }, [onPlayCallback, onPauseCallback]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await container.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported
    }
  }, []);

  const showVolumeOverlayWithTimeout = useCallback(() => {
    setShowVolumeOverlay(true);
    if (volumeOverlayTimeoutRef.current) clearTimeout(volumeOverlayTimeoutRef.current);
    volumeOverlayTimeoutRef.current = setTimeout(() => setShowVolumeOverlay(false), 1000);
  }, []);

  const showSpeedOverlayWithTimeout = useCallback(() => {
    setShowSpeedOverlay(true);
    if (speedOverlayTimeoutRef.current) clearTimeout(speedOverlayTimeoutRef.current);
    speedOverlayTimeoutRef.current = setTimeout(() => setShowSpeedOverlay(false), 1000);
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      let target = video.currentTime + seconds;
      if (seconds > 0 && seekRestricted) {
        target = Math.min(target, maxWatchedPosition.current);
      }
      video.currentTime = Math.max(0, Math.min(video.duration, target));
      onSeekCallback?.();
    },
    [seekRestricted, onSeekCallback]
  );

  const handleDoubleTap = useCallback(
    (e: React.TouchEvent<HTMLVideoElement>) => {
      const now = Date.now();
      const tapX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX;
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const distanceFromLastTap = Math.abs(tapX - lastTapXRef.current);

      if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && distanceFromLastTap < 50) {
        e.preventDefault();
        const videoRect = videoRef.current?.getBoundingClientRect();
        if (!videoRect) return;
        const tapXRelative = tapX - videoRect.left;
        const videoWidth = videoRect.width;
        if (tapXRelative < videoWidth / 3) {
          skip(-10);
        } else if (tapXRelative > (videoWidth * 2) / 3) {
          skip(10);
        }
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
        lastTapXRef.current = tapX;
      }
    },
    [skip]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          showVolumeOverlayWithTimeout();
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          showVolumeOverlayWithTimeout();
          break;
        case "m":
          toggleMute();
          showVolumeOverlayWithTimeout();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
          e.preventDefault();
          onTheaterToggle?.();
          break;
        case "i":
          e.preventDefault();
          togglePiP();
          break;
        case "c":
          e.preventDefault();
          if (e.shiftKey && captionsEnUrl && captionsArUrl) {
            setCaptionLanguage((prev) => (prev === "en" ? "ar" : prev === "ar" ? "off" : "en"));
          } else if (captionsEnUrl || captionsArUrl) {
            setCaptionLanguage((prev) => (prev === "off" ? (captionsEnUrl ? "en" : "ar") : "off"));
          }
          break;
        case "?":
          e.preventDefault();
          setShowKeyboardShortcuts((s) => !s);
          break;
        case "escape":
          if (showKeyboardShortcuts) {
            e.preventDefault();
            setShowKeyboardShortcuts(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, togglePiP, handleVolumeChange, volume, onTheaterToggle, skip, showVolumeOverlayWithTimeout, captionsEnUrl, captionsArUrl, showKeyboardShortcuts]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);

    // Update max watched position
    if (video.currentTime > maxWatchedPosition.current) {
      maxWatchedPosition.current = video.currentTime;
    }

    // Mark watched segment
    onSegmentUpdate?.(video.currentTime);

    // Check completion using per-lesson threshold
    if (
      !completionTriggered.current &&
      video.duration > 0 &&
      video.currentTime / video.duration >= completionThreshold
    ) {
      completionTriggered.current = true;
      onComplete?.();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = clickX / rect.width;
    let target = fraction * video.duration;

    // Seek restriction: clamp forward seek on first watch
    if (seekRestricted && target > maxWatchedPosition.current) {
      target = maxWatchedPosition.current;
    }

    video.currentTime = target;
    onSeekCallback?.();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onPauseCallback?.();
    onProgress?.(duration, duration);

    if (nextLesson) {
      setShowNextOverlay(true);
      setCountdown(VIDEO_AUTOPLAY_COUNTDOWN_SECONDS);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current)
              clearInterval(countdownIntervalRef.current);
            setShowNextOverlay(false);
            nextLesson.onPlay();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const cancelAutoplay = () => {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    setShowNextOverlay(false);
  };

  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    const maxSpeed = restrictSpeed ? VIDEO_MAX_RESTRICTED_SPEED : 2;
    const finalSpeed = Math.min(speed, maxSpeed);
    video.playbackRate = finalSpeed;
    setPlaybackSpeed(finalSpeed);
    setShowSpeedMenu(false);
    showSpeedOverlayWithTimeout();
    if (typeof window !== "undefined") {
      localStorage.setItem("videoPlayerSpeed", finalSpeed.toString());
    }
  };

  const retryLoad = () => {
    const video = videoRef.current;
    if (!video) return;
    setHasError(false);
    setErrorMessage("");
    video.load();
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const speeds = restrictSpeed ? RESTRICTED_SPEEDS : PLAYBACK_SPEEDS;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Watched segments progress bar overlay
  const segmentFillPercent =
    watchedSegments && watchedSegments.length > 0
      ? (watchedSegments.filter(Boolean).length / watchedSegments.length) * 100
      : 0;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-black group",
        isTheaterMode ? "aspect-[21/9]" : "aspect-video"
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        className="h-full w-full"
        onClick={togglePlay}
        onTouchEnd={handleDoubleTap}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          setIsPlaying(true);
          onPlayCallback?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPauseCallback?.();
        }}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video) setDuration(video.duration);
        }}
        onEnded={handleEnded}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => {
          setIsBuffering(false);
          setHasError(false);
        }}
        onError={() => {
          setIsBuffering(false);
          setHasError(true);
          setErrorMessage("Failed to load video. Please try again.");
        }}
        playsInline
        controlsList="nodownload"
      />

      {/* DevTools Warning Banner */}
      {devtoolsOpen && (
        <div className="absolute top-0 inset-x-0 bg-yellow-500/90 text-black text-center text-xs py-1.5 font-medium z-20">
          <AlertCircle className="inline h-3.5 w-3.5 me-1 -mt-0.5" />
          {t("devtoolsWarning")}
        </div>
      )}

      {/* Buffering spinner */}
      <AnimatePresence>
        {isBuffering && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="h-10 w-10 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3"
          >
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-white text-sm text-center max-w-xs">{errorMessage}</p>
            <button
              onClick={retryLoad}
              className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play overlay for paused state */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && !hasError && !showNextOverlay && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"
            onClick={togglePlay}
            aria-label={t("fullscreen")}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg"
            >
              <Play className="h-8 w-8 text-brand-900 ms-1" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Volume feedback overlay */}
      <AnimatePresence>
        {showVolumeOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-none absolute start-4 top-4 z-30"
          >
            <div className="flex items-center gap-3 rounded-lg bg-black/90 px-4 py-3 backdrop-blur-sm">
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
                <span className="min-w-[3ch] text-xs font-medium text-white tabular-nums">
                  {isMuted ? "0" : Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed feedback overlay */}
      <AnimatePresence>
        {showSpeedOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-none absolute end-4 top-4 z-30"
          >
            <div className="flex items-center gap-2 rounded-lg bg-black/90 px-4 py-3 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">{playbackSpeed}x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Panel */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-xl rounded-lg bg-gray-900/95 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-brand-400" />
                  <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">Playback</h4>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ["Play/Pause", "Space / K"],
                      ["Rewind 5s", "\u2190"],
                      ["Forward 5s", "\u2192"],
                      ["Rewind 10s", "J"],
                      ["Forward 10s", "L"],
                    ].map(([label, key]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-white/70">{label}</span>
                        <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">Volume & Display</h4>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ["Volume Up", "\u2191"],
                      ["Volume Down", "\u2193"],
                      ["Mute/Unmute", "M"],
                      ["Fullscreen", "F"],
                      ["Theater Mode", "T"],
                      ["PiP", "I"],
                      ["Captions", "C"],
                      ["Shortcuts", "?"],
                    ].map(([label, key]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-white/70">{label}</span>
                        <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-brand-500/10 p-2 text-center">
                <p className="text-xs text-white/60">
                  Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">?</kbd> anytime to toggle this panel
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-play next overlay */}
      <AnimatePresence>
        {showNextOverlay && nextLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-4"
          >
            <p className="text-white/70 text-sm">{t("upNext")}</p>
            <p className="text-white text-lg font-semibold text-center max-w-sm">
              {nextLesson.title}
            </p>
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  opacity={0.2}
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${((VIDEO_AUTOPLAY_COUNTDOWN_SECONDS - countdown) / VIDEO_AUTOPLAY_COUNTDOWN_SECONDS) * 175.93} 175.93`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold">
                {countdown}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelAutoplay}
                className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                {t("cancelAutoplay")}
              </button>
              <button
                onClick={() => {
                  cancelAutoplay();
                  nextLesson.onPlay();
                }}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
              >
                <SkipForward className="h-4 w-4" />
                {t("playNow")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 transition-opacity z-10",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar with bookmark markers */}
        <div
          className="mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/30 relative group/progress"
          onClick={handleSeek}
        >
          {/* Watched segments background (subtle overlay) */}
          {watchedSegments && watchedSegments.length > 0 && (
            <div
              className="absolute inset-y-0 start-0 rounded-full bg-white/15"
              style={{ width: `${segmentFillPercent}%` }}
            />
          )}

          {/* Progress fill */}
          <div
            className="h-full rounded-full bg-brand-500 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber thumb */}
            <div className="absolute end-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-brand-500 border-2 border-white shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>

          {/* Seek restriction indicator */}
          {seekRestricted && duration > 0 && (
            <div
              className="absolute inset-y-0 rounded-full bg-red-500/20 pointer-events-none"
              style={{
                left: `${(maxWatchedPosition.current / duration) * 100}%`,
                right: 0,
              }}
            />
          )}

          {/* Bookmark dots on scrubber */}
          {bookmarks.map((bm) => {
            if (!duration || duration <= 0) return null;
            const pos = (bm.timestamp_seconds / duration) * 100;
            return (
              <div
                key={bm.id}
                className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border border-white/50 z-10 cursor-pointer"
                style={{
                  left: `${pos}%`,
                  backgroundColor: VIDEO_BOOKMARK_COLORS[bm.color],
                }}
                title={bm.note ?? ""}
                onClick={(e) => {
                  e.stopPropagation();
                  const video = videoRef.current;
                  if (video) {
                    let target = bm.timestamp_seconds;
                    if (seekRestricted && target > maxWatchedPosition.current) {
                      target = maxWatchedPosition.current;
                    }
                    video.currentTime = target;
                  }
                }}
              />
            );
          })}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="hover:text-brand-300"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            {/* Volume with slider */}
            <div
              className="relative flex items-center gap-1"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="hover:text-brand-300"
                aria-label={t("volume")}
              >
                <VolumeIcon className="h-5 w-5" />
              </button>
              {showVolumeSlider && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-20 h-1 accent-brand-500 cursor-pointer"
                  aria-label={t("volume")}
                />
              )}
            </div>

            <span className="text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 text-xs hover:text-brand-300"
                aria-label={t("speed")}
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full end-0 mb-2 rounded-md bg-gray-900 py-1 shadow-lg min-w-[80px]">
                  {speeds.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={cn(
                        "block w-full px-4 py-1 text-start text-xs hover:bg-white/10",
                        speed === playbackSpeed &&
                          "text-brand-400 font-medium"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Captions */}
            <CaptionsSelector
              captionLanguage={captionLanguage}
              onCaptionChange={setCaptionLanguage}
              hasEnglish={!!captionsEnUrl}
              hasArabic={!!captionsArUrl}
            />

            {/* Quality */}
            <QualitySelector
              qualityLevels={qualityLevels}
              currentQualityIndex={currentQualityIndex}
              onQualityChange={setQualityLevel}
            />

            {/* Theater mode */}
            {onTheaterToggle && (
              <button
                onClick={onTheaterToggle}
                className="hover:text-brand-300 hidden sm:block"
                title={
                  isTheaterMode ? t("exitTheater") : t("theaterMode")
                }
                aria-label={
                  isTheaterMode ? t("exitTheater") : t("theaterMode")
                }
              >
                {isTheaterMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}

            {/* PiP */}
            <button
              onClick={togglePiP}
              className="hover:text-brand-300 hidden sm:block"
              title={t("pictureInPicture")}
              aria-label={t("pictureInPicture")}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-brand-300"
              aria-label={
                isFullscreen ? t("exitFullscreen") : t("fullscreen")
              }
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
