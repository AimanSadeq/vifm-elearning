import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPlanId } = await request.json();

    if (!newPlanId) {
      return NextResponse.json(
        { error: "newPlanId is required" },
        { status: 400 }
      );
    }

    // Fetch current subscription
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, plan_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active Stripe subscription found" },
        { status: 404 }
      );
    }

    // Fetch new plan
    const { data: newPlan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, stripe_price_id, plan_type, price, currency")
      .eq("id", newPlanId)
      .eq("is_active", true)
      .single();

    if (!newPlan || !newPlan.stripe_price_id) {
      return NextResponse.json(
        { error: "New plan not found or not configured with Stripe" },
        { status: 404 }
      );
    }

    // Lifetime plans can't be changed via Stripe subscription update
    if (newPlan.plan_type === "lifetime") {
      return NextResponse.json(
        { error: "Cannot change to a lifetime plan. Please subscribe to it separately." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Get current Stripe subscription to find the item
    const stripeSub = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id
    );
    const currentItem = stripeSub.items.data[0];

    if (!currentItem) {
      return NextResponse.json(
        { error: "Cannot find subscription item in Stripe" },
        { status: 500 }
      );
    }

    // Update with proration
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [
        {
          id: currentItem.id,
          price: newPlan.stripe_price_id,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Update DB
    await supabaseAdmin
      .from("subscriptions")
      .update({
        plan: newPlan.plan_type,
        plan_id: newPlan.id,
        price: newPlan.price,
        currency: newPlan.currency,
        cancel_at_period_end: false,
        cancelled_at: null,
      })
      .eq("id", sub.id);

    return NextResponse.json({ data: { changed: true } });
  } catch (err) {
    console.error("Plan change error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
