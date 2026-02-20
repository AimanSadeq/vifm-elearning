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
} from "lucide-react";
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
import { sendBeaconProgress } from "@/lib/utils/progress-queue";
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
  // New optional props (all backward-compatible)
  captionsEnUrl?: string | null;
  captionsArUrl?: string | null;
  bookmarks?: BookmarkItem[];
  onSeekTo?: React.MutableRefObject<((seconds: number) => void) | null>;
  restrictSpeed?: boolean;
  isTheaterMode?: boolean;
  onTheaterToggle?: () => void;
  nextLesson?: { title: string; onPlay: () => void } | null;
  onTimeUpdate?: (seconds: number) => void;
  userId?: string;
  lessonId?: string;
  courseId?: string;
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
  userId,
  lessonId,
  courseId,
}: VideoPlayerProps) {
  const t = useTranslations("player");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTriggered = useRef(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captionLanguage, setCaptionLanguage] = useState<"off" | "en" | "ar">("off");
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  // Auto-play next state
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(VIDEO_AUTOPLAY_COUNTDOWN_SECONDS);

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

  // Expose seekTo via ref
  useEffect(() => {
    if (onSeekTo) {
      onSeekTo.current = (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      };
    }
    return () => {
      if (onSeekTo) onSeekTo.current = null;
    };
  }, [onSeekTo]);

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

  // Progress tracking
  useEffect(() => {
    if (isPlaying && onProgress) {
      progressInterval.current = setInterval(() => {
        const video = videoRef.current;
        if (video) {
          onProgress(video.currentTime, video.duration);
        }
      }, VIDEO_PROGRESS_INTERVAL);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, onProgress]);

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

  // sendBeacon on beforeunload
  useEffect(() => {
    const handleUnload = () => {
      const video = videoRef.current;
      if (!video || !userId || !lessonId || !courseId) return;
      if (video.currentTime > 0 && video.duration > 0) {
        sendBeaconProgress({
          userId,
          lessonId,
          courseId,
          progressSeconds: Math.floor(video.currentTime),
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [userId, lessonId, courseId]);

  // Caption tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing tracks
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
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

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
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case "m":
          toggleMute();
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, togglePiP, handleVolumeChange, volume, onTheaterToggle]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);

    // Check completion
    if (
      !completionTriggered.current &&
      video.duration > 0 &&
      video.currentTime / video.duration >= VIDEO_COMPLETION_THRESHOLD
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
    video.currentTime = fraction * video.duration;
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
        onTimeUpdate={handleTimeUpdate}
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
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <Loader className="h-10 w-10 text-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-white text-sm text-center max-w-xs">{errorMessage}</p>
          <button
            onClick={retryLoad}
            className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Play overlay for paused state */}
      {!isPlaying && !isBuffering && !hasError && !showNextOverlay && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"
          onClick={togglePlay}
          aria-label={t("fullscreen")}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="h-8 w-8 text-brand-900 ms-1" />
          </div>
        </button>
      )}

      {/* Auto-play next overlay */}
      {showNextOverlay && nextLesson && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-4">
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
        </div>
      )}

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
          {/* Progress fill */}
          <div
            className="h-full rounded-full bg-brand-500 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber thumb */}
            <div className="absolute end-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-brand-500 border-2 border-white shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>

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
                  if (video) video.currentTime = bm.timestamp_seconds;
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
