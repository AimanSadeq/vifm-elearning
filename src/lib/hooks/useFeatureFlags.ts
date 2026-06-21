"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin-controllable feature flags read from the `site_settings` table.
 * Both default to OFF (hidden) when the row is missing, so the tabs stay
 * hidden until an admin explicitly enables them on the platform settings page.
 */

interface FeatureFlags {
  subscriptions: boolean;
  learningPaths: boolean;
  isLoading: boolean;
}

const KEYS = ["feature_subscriptions", "feature_learning_paths"] as const;

// Tiny in-memory cache so multiple components share one fetch per session.
let cached: { subscriptions: boolean; learningPaths: boolean } | null = null;
let inflight: Promise<void> | null = null;

async function loadOnce() {
  if (cached) return;
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", KEYS as unknown as string[]);
    const map = new Map<string, unknown>();
    for (const row of data ?? []) map.set(row.key as string, row.value);
    cached = {
      subscriptions: map.get("feature_subscriptions") === true,
      learningPaths: map.get("feature_learning_paths") === true,
    };
  })();
  try {
    await inflight;
  } finally {
    inflight = null;
  }
}

export function useFeatureFlags(): FeatureFlags {
  const [state, setState] = useState<FeatureFlags>({
    subscriptions: cached?.subscriptions ?? false,
    learningPaths: cached?.learningPaths ?? false,
    isLoading: !cached,
  });

  useEffect(() => {
    let cancelled = false;
    loadOnce()
      .then(() => {
        if (cancelled || !cached) return;
        setState({
          subscriptions: cached.subscriptions,
          learningPaths: cached.learningPaths,
          isLoading: false,
        });
      })
      .catch(() => {
        // On error keep the safe defaults (hidden); just stop loading.
        if (!cancelled) setState((s) => ({ ...s, isLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Clear the cache so the next render refetches (call after admin saves). */
export function invalidateFeatureFlags() {
  cached = null;
}
