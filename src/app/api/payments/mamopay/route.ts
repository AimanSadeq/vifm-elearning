import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentLink } from "@/lib/services/mamopay";
import { createEnrollmentFromPayment } from "@/lib/services/enrollment-service";
import { validatePromoForCheckout } from "@/lib/services/promo";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { APP_URL } from "@/lib/env";

/**
 * A discount voucher that brings the price to $0 must NOT go through MamoPay —
 * the gateway floors any charge to a 2-unit minimum, so a "free" course would
 * still bill the learner. When the voucher fully covers the price we enroll
 * directly here (mirroring the full_access path in /api/vouchers/redeem):
 * a completed $0 payment, an enrollment, and the recorded redemption.
 *
 * Returns the new payment id on a free enrollment, or null when the voucher
 * doesn't apply or only partially discounts (those fall through to the gateway).
 * Throws a user-facing message when the voucher is invalid for this learner.
 */
async function freeEnrollIfFullyCovered(params: {
  voucherId: string;
  courseId: string;
  userId: string;
  course: { price: number | string; currency: string };
  priceAfterPromo: number;
}): Promise<{ paymentId: string } | null> {
  const { voucherId, courseId, userId, course, priceAfterPromo } = params;

  const { data: voucher } = await supabaseAdmin
    .from("vouchers")
    .select("*")
    .eq("id", voucherId)
    .eq("is_active", true)
    .single();
  if (!voucher || voucher.voucher_type === "full_access") return null;

  const now = new Date();
  if (voucher.starts_at && new Date(voucher.starts_at) > now) return null;
  if (voucher.expires_at && new Date(voucher.expires_at) < now) return null;
  if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) return null;
  if (
    voucher.applicable_courses &&
    voucher.applicable_courses.length > 0 &&
    !voucher.applicable_courses.includes(courseId)
  )
    return null;

  // Only take the free path when the discount covers the full price. Partial
  // discounts are out of scope and continue to the gateway.
  const discount =
    voucher.voucher_type === "percentage"
      ? priceAfterPromo * (Number(voucher.discount_value) / 100)
      : Number(voucher.discount_value);
  if (Math.max(0, priceAfterPromo - discount) > 0) return null;

  const { data: existingRedemption } = await supabaseAdmin
    .from("voucher_redemptions")
    .select("id")
    .eq("voucher_id", voucher.id)
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existingRedemption) {
    throw new Error("You have already used this voucher for this course.");
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: userId,
      course_id: courseId,
      amount: 0,
      currency: course.currency,
      status: "completed",
      payment_method: "voucher",
      payment_type: "course_purchase",
      discount_amount: Number(course.price),
      paid_at: new Date().toISOString(),
      metadata: {
        voucher_id: voucher.id,
        voucher_code: voucher.code,
        voucher_type: voucher.voucher_type,
        original_price: Number(course.price),
      },
    })
    .select("id")
    .single();
  if (paymentError)
    throw new Error(`Failed to create payment: ${paymentError.message}`);

  await createEnrollmentFromPayment({ userId, courseId, paymentId: payment.id });

  const { error: redemptionError } = await supabaseAdmin
    .from("voucher_redemptions")
    .insert({
      voucher_id: voucher.id,
      user_id: userId,
      course_id: courseId,
      payment_id: payment.id,
    });
  if (redemptionError)
    throw new Error(
      `Failed to record voucher redemption: ${redemptionError.message}`,
    );

  const { data: incremented, error: updateError } = await supabaseAdmin.rpc(
    "atomic_increment_voucher_usage",
    { p_voucher_id: voucher.id },
  );
  if (updateError)
    throw new Error(`Failed to update voucher usage: ${updateError.message}`);
  if (!incremented) {
    throw new Error("Voucher usage limit reached.");
  }

  return { paymentId: payment.id };
}

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "payments:mamopay",
      buckets: [
        { limit: 5, windowMs: 60_000 },
        { limit: 30, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.MAMOPAY_API_KEY) {
      return NextResponse.json(
        {
          error:
            "MamoPay is not configured yet. Please pick a different payment method or contact support.",
        },
        { status: 503 }
      );
    }

    const { courseId, promoCode, voucherId, locale } = await request.json();
    if (!courseId)
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

    // Redirect targets must carry the locale prefix — the app routes live under
    // /[locale]/..., and the middleware's auto-prefix is unreliable behind the
    // proxy, so an unprefixed /payment/success 404s.
    const safeLocale = locale === "ar" ? "ar" : "en";

    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();
    if (!course)
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );

    // Guard against a duplicate purchase: an already-enrolled learner who
    // reaches checkout (e.g. via a stale link or the browser back button)
    // must not be charged again.
    const { data: existingEnrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    if (existingEnrollment)
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 400 }
      );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    let finalPrice = Number(course.price);
    let discountAmount = 0;
    let promoCodeId: string | null = null;

    if (promoCode) {
      const validated = await validatePromoForCheckout(
        promoCode,
        finalPrice,
        { courseId, client: supabaseAdmin }
      );
      if (validated) {
        promoCodeId = validated.promo.id;
        discountAmount = validated.discountAmount;
        finalPrice = validated.finalPrice;
      }
    }

    // A voucher that fully covers the price → enroll for free instead of
    // sending a $0 (floored to 2) charge to MamoPay.
    if (voucherId) {
      try {
        const free = await freeEnrollIfFullyCovered({
          voucherId,
          courseId,
          userId: user.id,
          course: { price: course.price, currency: course.currency },
          priceAfterPromo: finalPrice,
        });
        if (free) {
          return NextResponse.json({
            data: {
              url: `${APP_URL}/${safeLocale}/payment/success?payment_id=${free.paymentId}`,
              paymentId: free.paymentId,
            },
          });
        }
      } catch (voucherErr) {
        return NextResponse.json(
          {
            error:
              voucherErr instanceof Error
                ? voucherErr.message
                : "Voucher could not be applied.",
          },
          { status: 400 }
        );
      }
    }

    // A $0 total with no voucher (e.g. a price-0 course that was left as paid
    // / not flagged "Free Course", or a promo that zeroes it) must not reach
    // MamoPay either — it would floor the charge to a 2-unit minimum. Enroll
    // for free directly instead.
    if (finalPrice <= 0) {
      const { data: freePayment, error: freeErr } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: 0,
          currency: course.currency,
          status: "completed",
          payment_method: "free",
          payment_type: "course_purchase",
          promo_code_id: promoCodeId,
          discount_amount: discountAmount,
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (freeErr)
        return NextResponse.json({ error: freeErr.message }, { status: 500 });

      await createEnrollmentFromPayment({
        userId: user.id,
        courseId,
        paymentId: freePayment.id,
      });

      return NextResponse.json({
        data: {
          url: `${APP_URL}/${safeLocale}/payment/success?payment_id=${freePayment.id}`,
          paymentId: freePayment.id,
        },
      });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: finalPrice,
        currency: course.currency,
        status: "pending",
        payment_method: "mamopay",
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        payment_type: "course_purchase",
      })
      .select()
      .single();
    if (paymentError)
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );

    const baseUrl = APP_URL;

    const link = await createPaymentLink({
      title: `${course.title}`.slice(0, 50),
      description: course.short_description ?? undefined,
      amount: finalPrice,
      currency: course.currency,
      returnUrl: `${baseUrl}/${safeLocale}/payment/success?payment_id=${payment.id}`,
      failureReturnUrl: `${baseUrl}/${safeLocale}/courses/${course.slug}/checkout`,
      externalId: payment.id,
      customer: {
        email: profile?.email ?? user.email ?? undefined,
        firstName: profile?.full_name?.split(" ")[0],
        lastName: profile?.full_name?.split(" ").slice(1).join(" "),
      },
    });

    await supabaseAdmin
      .from("payments")
      .update({
        metadata: {
          mamopay_link_id: link.id,
          gateway_response: link.raw,
        },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      data: { url: link.paymentUrl, paymentId: payment.id },
    });
  } catch (err) {
    console.error("MamoPay course checkout error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `MamoPay checkout failed: ${err.message}`
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
