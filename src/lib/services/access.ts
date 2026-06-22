import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Centralised access checks. Use these instead of hand-rolled enrollment
 * lookups so adding new access paths (subscriptions, vouchers, org licenses)
 * only requires editing this file.
 */

interface HasAccessOptions {
  /**
   * Optional pre-fetched course (saves a round-trip if you already have it).
   * Must include at least { is_free, instructor_id }.
   */
  course?: { is_free?: boolean | null; instructor_id?: string | null } | null;
  /** Optional Supabase client to reuse — defaults to the admin client */
  client?: SupabaseClient;
  /** Optional auth metadata for fast admin/instructor short-circuit */
  authMetadata?: { role?: string } | null;
}

/**
 * Returns the user's currently active, non-expired subscription (with
 * the joined plan metadata), or null. Lifetime plans have
 * `current_period_end = null`, treated as never expiring.
 */
export async function getActiveSubscription(
  userId: string,
  client: SupabaseClient = supabaseAdmin
) {
  const { data } = await client
    .from("subscriptions")
    .select(
      "id, status, plan_id, current_period_end, plan:subscription_plans!subscriptions_plan_id_fkey(plan_type, metadata)"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Lifetime → never expires
  if (data.current_period_end == null) return data;

  // Renewable → still inside current period
  if (new Date(data.current_period_end) > new Date()) return data;

  return null;
}

/**
 * Boolean version. Use when you only need yes/no.
 */
export async function userHasActiveSubscription(
  userId: string,
  client: SupabaseClient = supabaseAdmin
): Promise<boolean> {
  return Boolean(await getActiveSubscription(userId, client));
}

/**
 * Plan-aware feature check. Returns true if the user has an active sub AND
 * the joined plan's `metadata.features[featureKey]` is true.
 *
 * Available keys (seeded in the DB):
 *   all_courses, certificates, forums, mobile, webinars,
 *   priority_support, lifetime
 */
export async function userHasFeature(
  userId: string,
  featureKey: string,
  client: SupabaseClient = supabaseAdmin
): Promise<boolean> {
  const sub = await getActiveSubscription(userId, client);
  if (!sub) return false;
  const plan = (sub as { plan?: { metadata?: { features?: Record<string, boolean> } } | null }).plan;
  const features = plan?.metadata?.features ?? {};
  return features[featureKey] === true;
}

/**
 * Returns true if `userId` should be allowed to view course content for
 * `courseId`. Order of checks (cheapest first):
 *   1. User is super_admin (auth metadata)
 *   2. Course is free
 *   3. User is the course instructor
 *   4. User is enrolled (active enrollment row)
 *   5. User has an active subscription (any plan)
 *
 * On match, the side-effect of an active sub is to *auto-create* an
 * enrollment row so that progress/certs/etc. continue to work normally.
 */
export async function userHasCourseAccess(
  userId: string,
  courseId: string,
  opts: HasAccessOptions = {}
): Promise<boolean> {
  const client = opts.client ?? supabaseAdmin;

  // 1. Admin
  if (opts.authMetadata?.role === "super_admin") return true;

  // 2. Course flags (fetch only if not provided)
  let course = opts.course;
  if (!course) {
    const { data } = await client
      .from("courses")
      .select("is_free, instructor_id")
      .eq("id", courseId)
      .maybeSingle();
    course = data ?? null;
  }
  if (course?.is_free) return true;

  // 3. Course instructor
  if (course?.instructor_id && course.instructor_id === userId) return true;

  // 4. Direct enrollment (active OR completed — completed learners keep access
  //    so they can review the course, re-watch videos, and download materials).
  const { data: enrollment } = await client
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle();
  if (enrollment) return true;

  // 5. Active subscription → grant access (and auto-enroll for progress tracking)
  const subActive = await userHasActiveSubscription(userId, client);
  if (subActive) {
    await ensureSubscriptionEnrollment(userId, courseId, client);
    return true;
  }

  return false;
}

/**
 * Idempotently insert an enrollment row when a subscriber accesses a course
 * for the first time. Marked with metadata.source = 'subscription' so it can
 * be cleaned up if the sub is cancelled (a future job).
 */
export async function ensureSubscriptionEnrollment(
  userId: string,
  courseId: string,
  client: SupabaseClient = supabaseAdmin
) {
  const { data: existing } = await client
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await client
    .from("enrollments")
    .insert({
      user_id: userId,
      course_id: courseId,
      status: "active",
      enrolled_at: new Date().toISOString(),
      metadata: { source: "subscription" },
    })
    .select("id")
    .single();
  if (error) {
    console.error("ensureSubscriptionEnrollment failed:", error);
    return null;
  }
  return data;
}
