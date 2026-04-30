import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Per-IP, in-process token bucket. Fine for a single Next.js process and
 * good enough to stop casual abuse on auth / promo / login endpoints.
 * Behind multiple instances or a serverless platform this should be
 * replaced with Redis/KV — see callers for documented assumptions.
 */
type WindowRecord = { count: number; firstAt: number };

interface BucketDefinition {
  /** Allowed requests within the rolling window. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
  /** Optional Retry-After hint sent on 429s (seconds). Defaults to windowMs/1000. */
  retryAfter?: number;
}

interface RateLimitOptions {
  /** Stable namespace used to scope the bucket map (one Map per scope). */
  scope: string;
  buckets: BucketDefinition[];
}

const stores = new Map<string, Map<string, WindowRecord>>();

function getStore(scope: string): Map<string, WindowRecord> {
  let s = stores.get(scope);
  if (!s) {
    s = new Map();
    stores.set(scope, s);
  }
  return s;
}

function checkBucket(
  store: Map<string, WindowRecord>,
  key: string,
  limit: number,
  windowMs: number,
  now: number
): boolean {
  const rec = store.get(key);
  if (!rec || now - rec.firstAt > windowMs) {
    store.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}

function pruneStale(
  store: Map<string, WindowRecord>,
  windowMs: number,
  now: number
) {
  if (store.size < 1000) return;
  for (const [k, rec] of store) {
    if (now - rec.firstAt > windowMs) store.delete(k);
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check the request against one or more per-IP buckets. Returns null when
 * the request is allowed; returns a NextResponse 429 when rate-limited.
 *
 * Use multiple buckets to combine a short burst limit with a long-term
 * cap (e.g. 5/min + 30/hour). Each bucket is checked in order, so list
 * the most generous (short) one first.
 */
export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(request);
  const now = Date.now();

  for (let i = 0; i < options.buckets.length; i++) {
    const def = options.buckets[i];
    const store = getStore(`${options.scope}:${i}`);
    pruneStale(store, def.windowMs, now);
    if (!checkBucket(store, ip, def.limit, def.windowMs, now)) {
      const retryAfter = def.retryAfter ?? Math.ceil(def.windowMs / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  return null;
}
