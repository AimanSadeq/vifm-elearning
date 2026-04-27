import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

// Per-IP throttle. In-memory only — fine for a single Next.js process and good
// enough to stop casual abuse. Behind multiple instances or a serverless
// platform this needs replacing with Redis/KV. Numbers picked for genuine
// human use: a person filling the form may submit twice if the first
// network call hangs, but should never need 6 attempts in a minute.
type WindowRecord = { count: number; firstAt: number };
const SHORT_LIMIT = 5;
const SHORT_WINDOW_MS = 60_000; // 1 minute
const LONG_LIMIT = 30;
const LONG_WINDOW_MS = 60 * 60_000; // 1 hour
const shortBuckets = new Map<string, WindowRecord>();
const longBuckets = new Map<string, WindowRecord>();

function checkBucket(
  bucket: Map<string, WindowRecord>,
  ip: string,
  limit: number,
  windowMs: number,
  now: number
): boolean {
  const rec = bucket.get(ip);
  if (!rec || now - rec.firstAt > windowMs) {
    bucket.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}

function pruneStale(bucket: Map<string, WindowRecord>, windowMs: number, now: number) {
  if (bucket.size < 1000) return; // cheap fast path
  for (const [ip, rec] of bucket) {
    if (now - rec.firstAt > windowMs) bucket.delete(ip);
  }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  pruneStale(shortBuckets, SHORT_WINDOW_MS, now);
  pruneStale(longBuckets, LONG_WINDOW_MS, now);

  if (!checkBucket(shortBuckets, ip, SHORT_LIMIT, SHORT_WINDOW_MS, now)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  if (!checkBucket(longBuckets, ip, LONG_LIMIT, LONG_WINDOW_MS, now)) {
    return NextResponse.json(
      { error: "Hourly limit reached. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Pull the current user (if logged in) so admins can see who reached out.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

  const { error } = await supabaseAdmin.from("contact_submissions").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    user_id: user?.id ?? null,
    ip_address: ip === "unknown" ? null : ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("[contact] insert error:", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
