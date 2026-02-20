/**
 * localStorage-based retry queue for failed progress saves.
 * When a save to the progress API fails (network error, server error,
 * or sendBeacon returning false), the payload is queued here and
 * retried the next time the course viewer mounts.
 */

import { PROGRESS_QUEUE_KEY } from "./constants";

const MAX_ITEMS = 50;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 5;

interface QueuedSave {
  id: string;
  payload: Record<string, unknown>;
  enqueuedAt: number;
  retryCount: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readQueue(): QueuedSave[] {
  try {
    const raw = localStorage.getItem(PROGRESS_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedSave[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedSave[]): void {
  try {
    localStorage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable — silently drop
  }
}

/**
 * Add a failed save payload to the retry queue.
 * Drops oldest items when the queue exceeds MAX_ITEMS.
 */
export function enqueueFailedSave(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const queue = readQueue();

  queue.push({
    id: generateId(),
    payload,
    enqueuedAt: Date.now(),
    retryCount: 0,
  });

  // Cap at MAX_ITEMS, dropping oldest first
  if (queue.length > MAX_ITEMS) {
    queue.splice(0, queue.length - MAX_ITEMS);
  }

  writeQueue(queue);
}

/**
 * Return all queued saves (for diagnostics).
 */
export function getQueuedSaves(): QueuedSave[] {
  if (typeof window === "undefined") return [];
  return readQueue();
}

/**
 * Remove a single item from the queue by id.
 */
export function removeFromQueue(id: string): void {
  const queue = readQueue();
  writeQueue(queue.filter((item) => item.id !== id));
}

/**
 * Process all queued saves: POST each to the video progress API.
 * On success → remove from queue.
 * On failure → increment retryCount. Drop items after MAX_RETRIES or MAX_AGE_MS.
 */
export async function processRetryQueue(): Promise<void> {
  if (typeof window === "undefined") return;

  const queue = readQueue();
  if (queue.length === 0) return;

  const now = Date.now();
  const remaining: QueuedSave[] = [];

  for (const item of queue) {
    // Drop items that are too old or have exhausted retries
    if (now - item.enqueuedAt > MAX_AGE_MS || item.retryCount >= MAX_RETRIES) {
      continue;
    }

    try {
      const response = await fetch("/api/video/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        // Server error — keep in queue for retry
        item.retryCount++;
        remaining.push(item);
      }
      // Success — don't push to remaining (effectively removes it)
    } catch {
      // Network error — keep in queue for retry
      item.retryCount++;
      remaining.push(item);
    }
  }

  writeQueue(remaining);
}

/**
 * Send progress via navigator.sendBeacon (for page unload).
 * Falls back to enqueueFailedSave if beacon fails.
 */
export function sendBeaconProgress(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });

  const sent = navigator.sendBeacon("/api/video/progress", blob);
  if (!sent) {
    try {
      enqueueFailedSave(payload);
    } catch {
      /* best effort */
    }
  }
}
