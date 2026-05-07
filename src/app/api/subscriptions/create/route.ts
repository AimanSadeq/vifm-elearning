import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { APP_URL } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "subscriptions:create",
      buckets: [
        { limit: 5, windowMs: 60_000 },
        { limit: 30, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Fetch the plan
    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found or inactive" },
        { status: 404 }
      );
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: "You already have an active subscription. Cancel it first or change plan." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Auto-create Stripe Product + Price if not yet linked
    let stripePriceId = plan.stripe_price_id;

    if (!stripePriceId) {
      // Create Stripe Product
      let stripeProductId = plan.stripe_product_id;

      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description ?? undefined,
          metadata: { plan_id: plan.id },
        });
        stripeProductId = product.id;
      }

      // Create Stripe Price
      const isRecurring = plan.plan_type !== "lifetime";
      const intervalMap: Record<string, "month" | "year"> = {
        monthly: "month",
        quarterly: "month",
        annual: "year",
      };

      let price;

      if (isRecurring) {
        price = await stripe.prices.create({
          product: stripeProductId!,
          unit_amount: Math.round(plan.price * 100),
          currency: plan.currency.toLowerCase(),
          recurring: {
            interval: intervalMap[plan.plan_type] ?? "month",
            interval_count: plan.plan_type === "quarterly" ? 3 : 1,
          },
        });
      } else {
        price = await stripe.prices.create({
          product: stripeProductId!,
          unit_amount: Math.round(plan.price * 100),
          currency: plan.currency.toLowerCase(),
        });
      }
      stripePriceId = price.id;

      // Update plan with Stripe IDs
      await supabaseAdmin
        .from("subscription_plans")
        .update({
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        })
        .eq("id", plan.id);
    }

    const baseUrl =
      APP_URL;

    // Create Stripe Checkout Session
    const isLifetime = plan.plan_type === "lifetime";

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? "payment" : "subscription",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planId: plan.id,
        planType: plan.plan_type,
        type: "subscription",
      },
      success_url: `${baseUrl}/subscription?success=true`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    if (err instanceof Error && err.message.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        {
          error:
            "Card payments are not configured yet. Please use the in-app checkout (/subscription/checkout) and pick a different payment method.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
