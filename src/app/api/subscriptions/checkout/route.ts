import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";
import { validatePromoForCheckout } from "@/lib/services/promo";

const INTERVAL_MAP: Record<string, "month" | "year"> = {
  monthly: "month",
  quarterly: "month",
  annual: "year",
};

/**
 * Create a Stripe Checkout Session for a subscription plan, optionally with a
 * promo code applied. Returns 503 with a clear message if Stripe isn't
 * configured (rather than the previous opaque 500).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "Card payments are not configured yet. Please pick a different payment method or contact support.",
        },
        { status: 503 }
      );
    }

    const { planId, promoCode } = await request.json();
    if (!planId)
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!plan)
      return NextResponse.json(
        { error: "Subscription plan not found or inactive" },
        { status: 404 }
      );

    // Block if user already has an active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub)
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Cancel it first or change plan from your subscription page.",
        },
        { status: 400 }
      );

    // Resolve promo code
    let promoCodeId: string | null = null;
    let stripeCouponId: string | undefined;
    let discountAmount = 0;
    let finalPrice = Number(plan.price);

    if (promoCode) {
      const validated = await validatePromoForCheckout(
        promoCode,
        finalPrice,
        { planId: plan.id, client: supabaseAdmin }
      );
      if (validated) {
        promoCodeId = validated.promo.id;
        discountAmount = validated.discountAmount;
        finalPrice = validated.finalPrice;

        // Best-effort: create an ephemeral Stripe coupon so the discount shows
        // on the checkout page itself.
        try {
          const stripe = getStripe();
          const coupon = await stripe.coupons.create(
            validated.promo.discount_type === "percentage"
              ? {
                  percent_off: Number(validated.promo.discount_value),
                  duration: "once",
                }
              : {
                  amount_off: Math.round(
                    Number(validated.promo.discount_value) * 100
                  ),
                  currency: plan.currency.toLowerCase(),
                  duration: "once",
                }
          );
          stripeCouponId = coupon.id;
        } catch (err) {
          console.warn("Could not create Stripe coupon:", err);
        }
      }
    }

    const stripe = getStripe();

    // Auto-create Stripe Product + Price if not yet linked
    let stripePriceId = plan.stripe_price_id;
    if (!stripePriceId) {
      let stripeProductId = plan.stripe_product_id;
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description ?? undefined,
          metadata: { plan_id: plan.id },
        });
        stripeProductId = product.id;
      }

      const isRecurring = plan.plan_type !== "lifetime";
      const price = isRecurring
        ? await stripe.prices.create({
            product: stripeProductId!,
            unit_amount: Math.round(plan.price * 100),
            currency: plan.currency.toLowerCase(),
            recurring: {
              interval: INTERVAL_MAP[plan.plan_type] ?? "month",
              interval_count: plan.plan_type === "quarterly" ? 3 : 1,
            },
          })
        : await stripe.prices.create({
            product: stripeProductId!,
            unit_amount: Math.round(plan.price * 100),
            currency: plan.currency.toLowerCase(),
          });
      stripePriceId = price.id;

      await supabaseAdmin
        .from("subscription_plans")
        .update({
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        })
        .eq("id", plan.id);
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://learn.viftraining.com";
    const isLifetime = plan.plan_type === "lifetime";

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? "payment" : "subscription",
      customer_email: user.email ?? undefined,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      ...(stripeCouponId
        ? { discounts: [{ coupon: stripeCouponId }] }
        : { allow_promotion_codes: true }),
      metadata: {
        userId: user.id,
        planId: plan.id,
        planType: plan.plan_type,
        type: "subscription",
        promoCodeId: promoCodeId ?? "",
      },
      success_url: `${baseUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/checkout?plan=${plan.id}`,
    });

    // Track pending payment so admin can see attempts
    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      amount: finalPrice,
      currency: plan.currency,
      status: "pending",
      payment_method: "stripe",
      stripe_session_id: session.id,
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      payment_type: "subscription",
      metadata: {
        plan_id: plan.id,
        plan_type: plan.plan_type,
        plan_name: plan.name,
      },
    });

    return NextResponse.json({
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err) {
    console.error("Subscription checkout error:", err);
    const message =
      err instanceof Error
        ? err.message.includes("STRIPE_SECRET_KEY")
          ? "Card payments are not configured yet."
          : "Failed to start checkout. Please try again or use a different payment method."
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
