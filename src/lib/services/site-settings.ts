import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Server-side reader for the site_settings KV table. Used by API routes
 * and email service code that needs admin-editable defaults without
 * shipping a client-only React hook.
 *
 * Each setting is cached in-process for 60 s. The TTL is short enough
 * that an admin change is reflected almost immediately, but long enough
 * to avoid hammering the DB on every email send / quiz create.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry<unknown>>();

export async function getSetting<T>(
  key: string,
  fallback: T,
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value as T;

  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    const value = (data?.value as T) ?? fallback;
    cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  } catch {
    return fallback;
  }
}

/** Forces the next read to bypass the in-process cache. */
export function invalidateSettingCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}
