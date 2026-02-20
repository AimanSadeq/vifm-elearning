"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type Hls from "hls.js";
import type { Events, ErrorData, Level } from "hls.js";

export interface HlsQualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

interface UseHlsPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hlsUrl: string | null | undefined;
  fallbackUrl: string;
}

interface UseHlsPlayerReturn {
  isHls: boolean;
  isNativeHls: boolean;
  qualityLevels: HlsQualityLevel[];
  currentQualityIndex: number;
  setQualityLevel: (index: number) => void;
  hlsInstance: Hls | null;
}

function buildQualityLabel(level: Level): string {
  const h = level.height;
  if (h >= 2160) return "4K";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  if (h >= 360) return "360p";
  if (h >= 240) return "240p";
  return `${h}p`;
}

export function useHlsPlayer({
  videoRef,
  hlsUrl,
  fallbackUrl,
}: UseHlsPlayerOptions): UseHlsPlayerReturn {
  const hlsRef = useRef<Hls | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [isNativeHls, setIsNativeHls] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<HlsQualityLevel[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(-1); // -1 = auto

  const setQualityLevel = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (hls) {
      hls.currentLevel = index; // -1 = auto, 0+ = specific level
      setCurrentQualityIndex(index);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) {
      setIsHls(false);
      setIsNativeHls(false);
      setQualityLevels([]);
      setCurrentQualityIndex(-1);
      return;
    }

    // Check native HLS support (Safari on iOS/macOS)
    const canPlayNativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (canPlayNativeHls) {
      video.src = hlsUrl;
      setIsHls(true);
      setIsNativeHls(true);
      setQualityLevels([]);
      setCurrentQualityIndex(-1);
      return;
    }

    // Chrome/Firefox/Edge: dynamic import HLS.js
    let destroyed = false;

    import("hls.js").then(({ default: HlsLib }) => {
      if (destroyed) return;

      if (HlsLib.isSupported()) {
        const hls = new HlsLib({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
        });

        hlsRef.current = hls;

        hls.on(
          HlsLib.Events.MANIFEST_PARSED,
          (
            _event: Events.MANIFEST_PARSED,
            data: { levels: Level[] }
          ) => {
            const levels: HlsQualityLevel[] = data.levels.map(
              (level, index) => ({
                index,
                height: level.height,
                width: level.width,
                bitrate: level.bitrate,
                label: buildQualityLabel(level),
              })
            );
            levels.sort((a, b) => b.height - a.height);
            setQualityLevels(levels);
            setIsHls(true);
            setIsNativeHls(false);
            setCurrentQualityIndex(-1);
          }
        );

        hls.on(
          HlsLib.Events.LEVEL_SWITCHED,
          (
            _event: Events.LEVEL_SWITCHED,
            data: { level: number }
          ) => {
            if (hlsRef.current && hlsRef.current.currentLevel === -1) {
              setCurrentQualityIndex(-1);
            } else {
              setCurrentQualityIndex(data.level);
            }
          }
        );

        hls.on(
          HlsLib.Events.ERROR,
          (_event: Events.ERROR, data: ErrorData) => {
            if (data.fatal) {
              switch (data.type) {
                case HlsLib.ErrorTypes.NETWORK_ERROR:
                  console.warn(
                    "[HLS] Fatal network error, attempting recovery..."
                  );
                  hls.startLoad();
                  break;
                case HlsLib.ErrorTypes.MEDIA_ERROR:
                  console.warn(
                    "[HLS] Fatal media error, attempting recovery..."
                  );
                  hls.recoverMediaError();
                  break;
                default:
                  console.error(
                    "[HLS] Fatal error, falling back to MP4:",
                    data.type
                  );
                  hls.destroy();
                  hlsRef.current = null;
                  setIsHls(false);
                  setIsNativeHls(false);
                  setQualityLevels([]);
                  setCurrentQualityIndex(-1);
                  video.src = fallbackUrl;
                  break;
              }
            }
          }
        );

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else {
        // Neither native HLS nor HLS.js supported
        console.warn("[HLS] Not supported, falling back to MP4");
        video.src = fallbackUrl;
        setIsHls(false);
        setIsNativeHls(false);
        setQualityLevels([]);
        setCurrentQualityIndex(-1);
      }
    });

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsHls(false);
      setIsNativeHls(false);
      setQualityLevels([]);
      setCurrentQualityIndex(-1);
    };
  }, [hlsUrl, fallbackUrl, videoRef]);

  return {
    isHls,
    isNativeHls,
    qualityLevels,
    currentQualityIndex,
    setQualityLevel,
    hlsInstance: hlsRef.current,
  };
}
