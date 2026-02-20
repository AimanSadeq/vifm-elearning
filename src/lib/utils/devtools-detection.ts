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
