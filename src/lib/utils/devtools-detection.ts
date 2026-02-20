/**
 * DevTools detection utility.
 * Warn-only mode — shows a banner but doesn't aggressively block functionality.
 */

const DETECTION_THRESHOLD = 160;

export function isDevToolsOpen(): boolean {
  if (typeof window === "undefined") return false;

  const widthDiff = window.outerWidth - window.innerWidth > DETECTION_THRESHOLD;
  const heightDiff =
    window.outerHeight - window.innerHeight > DETECTION_THRESHOLD;

  return widthDiff || heightDiff;
}

/**
 * Start monitoring for DevTools open/close events.
 * Returns a cleanup function.
 */
export function monitorDevTools(
  onOpen: () => void,
  onClose: () => void,
  intervalMs = 1000
): () => void {
  if (typeof window === "undefined") return () => {};

  let wasOpen = false;

  const interval = setInterval(() => {
    const open = isDevToolsOpen();
    if (open && !wasOpen) {
      wasOpen = true;
      onOpen();
    } else if (!open && wasOpen) {
      wasOpen = false;
      onClose();
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

// ── Time manipulation prevention ──────────────────────────────
// Uses performance.now() which cannot be manipulated via Date overrides.
// Warn-only: flags suspicious deltas but still saves progress (matches bank behavior).

const TIME_MANIPULATION_RATIO_THRESHOLD = 2.0;

interface TimeValidator {
  /** Call when playback starts or resumes. */
  start: () => void;
  /** Call when playback pauses or stops. Returns { elapsed, suspicious }. */
  stop: () => { elapsedMs: number; suspicious: boolean };
  /**
   * Validate a reported watch time delta against actual elapsed wall time.
   * Returns true if the ratio is suspicious (> threshold).
   */
  validate: (reportedDeltaSeconds: number) => boolean;
}

/**
 * Creates a time validator that tracks real elapsed time via performance.now().
 * If the reported watch time is more than 2x the actual wall clock time,
 * the delta is flagged as suspicious (warn-only, data still saves).
 */
export function createTimeValidator(): TimeValidator {
  let startTime: number | null = null;
  let accumulatedMs = 0;

  return {
    start() {
      if (startTime === null) {
        startTime = performance.now();
      }
    },

    stop() {
      let elapsed = 0;
      if (startTime !== null) {
        elapsed = performance.now() - startTime;
        accumulatedMs += elapsed;
        startTime = null;
      }
      return {
        elapsedMs: accumulatedMs,
        suspicious: false,
      };
    },

    validate(reportedDeltaSeconds: number) {
      // Capture current accumulated time
      let totalMs = accumulatedMs;
      if (startTime !== null) {
        totalMs += performance.now() - startTime;
      }

      const totalSeconds = totalMs / 1000;
      if (totalSeconds <= 0) return false;

      const ratio = reportedDeltaSeconds / totalSeconds;
      if (ratio > TIME_MANIPULATION_RATIO_THRESHOLD) {
        console.warn(
          `[TimeValidator] Suspicious watch time: reported=${reportedDeltaSeconds.toFixed(1)}s, actual=${totalSeconds.toFixed(1)}s, ratio=${ratio.toFixed(2)}`
        );
        return true;
      }
      return false;
    },
  };
}
