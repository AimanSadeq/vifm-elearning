import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/**
 * Rate-limiting with two backends:
 *
 * 1. Upstash Redis when both UPSTASH_REDIS_REST_URL and
 *    UPSTASH_REDIS_REST_TOKEN are set. This is the only correct option in
 *    production: a per-process `Map` cannot survive horizontal scaling
 *    (Render >1 instance, serverless, etc.) — an attacker simply hits each
 *    instance up to the limit.
 *
 * 2. Per-process in-memory token bucket as a fallback. Fine for single-
 *    instance dev; keep using it for local development without forcing
 *    Upstash setup.
 *
 * The public `applyRateLimit()` interface is unchanged so callers don't
 * need updating.
 */

interface BucketDefinition {
  limit: number;
  windowMs: number;
  retryAfter?: number;
}

interface RateLimitOptions {
  scope: string;
  buckets: BucketDefinition[];
}

// ---------- Upstash backend ----------

const upstashAvailable = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
);

let upstashRedis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashRedis(): Redis {
  if (!upstashRedis) {
    upstashRedis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return upstashRedis;
}

function getUpstashLimiter(
  scope: string,
  bucketIndex: number,
  bucket: BucketDefinition
): Ratelimit {
  const key = `${scope}:${bucketIndex}:${bucket.limit}:${bucket.windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getUpstashRedis(),
      limiter: Ratelimit.slidingWindow(
        bucket.limit,
        `${bucket.windowMs} ms` as `${number} ms`
      ),
      prefix: `rl:${scope}:${bucketIndex}`,
      analytics: false,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

// ---------- In-memory backend (dev / single-instance fallback) ----------

type WindowRecord = { count: number; firstAt: number };
const memStores = new Map<string, Map<string, WindowRecord>>();

function getMemStore(scope: string): Map<string, WindowRecord> {
  let s = memStores.get(scope);
  if (!s) {
    s = new Map();
    memStores.set(scope, s);
  }
  return s;
}

function memCheck(
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

// ---------- Shared helpers ----------

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function tooManyResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

/**
 * Apply per-IP rate limiting against one or more buckets. Buckets are
 * checked in order — list the most generous (short) one first when
 * combining a burst limit with a long-term cap. Returns null when the
 * request is allowed; returns a 429 NextResponse when limited.
 *
 * On Upstash failure (network blip / quota exceeded) we fail open: the
 * request is allowed. Failing closed would let a Redis outage take down
 * checkout, which is worse than briefly accepting a few extra requests.
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const now = Date.now();

  for (let i = 0; i < options.buckets.length; i++) {
    const bucket = options.buckets[i];
    const retryAfter = bucket.retryAfter ?? Math.ceil(bucket.windowMs / 1000);

    if (upstashAvailable) {
      try {
        const limiter = getUpstashLimiter(options.scope, i, bucket);
        const { success } = await limiter.limit(ip);
        if (!success) return tooManyResponse(retryAfter);
        continue;
      } catch (err) {
        // Fail open — log once and let the request through. A persistent
        // Upstash outage taking down /checkout is worse than briefly
        // un-rate-limited traffic.
        console.warn("[rate-limit] Upstash check failed, allowing:", err);
      }
    }

    const store = getMemStore(`${options.scope}:${i}`);
    pruneStale(store, bucket.windowMs, now);
    if (!memCheck(store, ip, bucket.limit, bucket.windowMs, now)) {
      return tooManyResponse(retryAfter);
    }
  }

  return null;
}
