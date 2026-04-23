"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  OFFICES as FALLBACK_OFFICES,
  SUPPORT_EMAIL as FALLBACK_SUPPORT_EMAIL,
  type Office,
} from "@/lib/site-content";

/**
 * Reads editable site-wide content (offices, support email, etc.) from the
 * `site_settings` DB table. Falls back to the compiled-in constants if the
 * DB is unreachable or a row is missing — so pages never break on a fresh
 * environment or a transient network blip.
 */

interface UseSiteSettingsResult {
  offices: Office[];
  supportEmail: string;
  isLoading: boolean;
}

// Tiny in-memory cache so multiple components on the same page share one fetch.
let cached: { offices: Office[]; supportEmail: string } | null = null;
let inflight: Promise<void> | null = null;

async function loadOnce() {
  if (cached) return;
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["offices", "support_email"]);
    const map = new Map<string, unknown>();
    for (const row of data ?? []) map.set(row.key as string, row.value);
    cached = {
      offices: Array.isArray(map.get("offices"))
        ? (map.get("offices") as Office[])
        : FALLBACK_OFFICES,
      supportEmail:
        typeof map.get("support_email") === "string"
          ? (map.get("support_email") as string)
          : FALLBACK_SUPPORT_EMAIL,
    };
  })();
  try {
    await inflight;
  } finally {
    inflight = null;
  }
}

export function useSiteSettings(): UseSiteSettingsResult {
  const [state, setState] = useState<UseSiteSettingsResult>({
    offices: cached?.offices ?? FALLBACK_OFFICES,
    supportEmail: cached?.supportEmail ?? FALLBACK_SUPPORT_EMAIL,
    isLoading: !cached,
  });

  useEffect(() => {
    let cancelled = false;
    loadOnce()
      .then(() => {
        if (cancelled || !cached) return;
        setState({
          offices: cached.offices,
          supportEmail: cached.supportEmail,
          isLoading: false,
        });
      })
      .catch(() => {
        // Keep fallbacks; flip loading off so UI doesn't sit at defaults-forever.
        if (!cancelled) setState((s) => ({ ...s, isLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Clear the in-memory cache so the next render refetches (call after admin edits). */
export function invalidateSiteSettings() {
  cached = null;
}
