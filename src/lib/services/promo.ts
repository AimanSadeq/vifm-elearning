/**
 * Centralised promo-code validation + redemption.
 *
 * Use this from EVERY checkout endpoint (course/sub × stripe/paytabs/mamopay/bank)
 * so that expiry, max_uses, and applicability are enforced uniformly. Previously
 * three of the four payment paths skipped these checks, letting users bypass.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

interface PromoRecord {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  expires_at: string | null;
  starts_at: string | null;
  max_uses: number | null;
  current_uses: number;
  min_purchase_amount: number | null;
  applicable_courses: string[] | null;
  is_active: boolean;
}

export interface ValidatedPromo {
  promo: PromoRecord;
  discountAmount: number;
  finalPrice: number;
}

interface ValidateOptions {
  /** Course ID (for course payments) — used to enforce applicable_courses */
  courseId?: string;
  /** Subscription plan ID (for sub payments) — promos with applicable_courses
   *  set are course-only and won't apply to subs */
  planId?: string;
  /** Reuse a Supabase client if you already have one */
  client?: SupabaseClient;
}

/**
 * Look up + fully validate a promo code for the given price.
 * Returns null if the code is invalid/expired/exhausted/not applicable.
 *
 * Centralises rules:
 *   1. code matches an active promo
 *   2. starts_at <= now (if set)
 *   3. expires_at > now (if set)
 *   4. current_uses < max_uses (if set)
 *   5. price >= min_purchase_amount (if set)
 *   6. course_id is in applicable_courses (if set, courseId required)
 *   7. for sub payments, applicable_courses must be empty/null (course-restricted
 *      promos don't apply to subscriptions by default)
 */
export async function validatePromoForCheckout(
  rawCode: string | null | undefined,
  basePrice: number,
  opts: ValidateOptions = {}
): Promise<ValidatedPromo | null> {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const client = opts.client ?? supabaseAdmin;

  const { data: promo } = await client
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!promo) return null;

  const now = new Date();
  if (promo.starts_at && new Date(promo.starts_at) > now) return null;
  if (promo.expires_at && new Date(promo.expires_at) < now) return null;
  if (
    promo.max_uses != null &&
    promo.current_uses >= promo.max_uses
  )
    return null;
  if (
    promo.min_purchase_amount != null &&
    Number(promo.min_purchase_amount) > basePrice
  )
    return null;

  const applicable = (promo.applicable_courses as string[] | null) ?? null;
  if (applicable && applicable.length > 0) {
    if (opts.courseId) {
      if (!applicable.includes(opts.courseId)) return null;
    } else if (opts.planId) {
      // Course-restricted promo cannot apply to a subscription plan
      return null;
    }
  }

  let discountAmount = 0;
  if (promo.discount_type === "percentage") {
    discountAmount = basePrice * (Number(promo.discount_value) / 100);
  } else {
    discountAmount = Number(promo.discount_value);
  }
  // Guard against negative final price
  discountAmount = Math.min(discountAmount, basePrice);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    promo: promo as PromoRecord,
    discountAmount,
    finalPrice,
  };
}

/**
 * Atomically increment current_uses on a promo. Should be called after
 * the payment is confirmed completed (in webhooks / admin confirm), not
 * on initial checkout — otherwise abandoned carts would burn promo uses.
 *
 * Uses a Postgres RPC if available; falls back to read-update-write
 * (still racy but better than nothing).
 */
export async function incrementPromoUsage(
  promoCodeId: string,
  client: SupabaseClient = supabaseAdmin
) {
  // Try the RPC first
  const { error: rpcError } = await client.rpc("increment_promo_usage", {
    promo_id: promoCodeId,
  });

  if (!rpcError) return;

  // Fallback: read-update-write (race-prone, but keeps behavior on platforms
  // where the RPC isn't deployed yet)
  const { data: existing } = await client
    .from("promo_codes")
    .select("current_uses")
    .eq("id", promoCodeId)
    .maybeSingle();
  if (!existing) return;
  await client
    .from("promo_codes")
    .update({ current_uses: (existing.current_uses ?? 0) + 1 })
    .eq("id", promoCodeId);
}
