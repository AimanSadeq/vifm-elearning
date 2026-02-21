import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";

export async function POST() {
  try {
    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's active subscription
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!sub) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // If it's a Stripe subscription, cancel at period end
    if (sub.stripe_subscription_id) {
      await getStripe().subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Update DB
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    return NextResponse.json({ data: { cancelled: true } });
  } catch (err) {
    console.error("Subscription cancel error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
