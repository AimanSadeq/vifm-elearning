import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";

/**
 * Create a Stripe Billing Portal session for the current user. The user must
 * have a Stripe customer attached (i.e. they completed at least one Stripe
 * subscription checkout in the past).
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
        { error: "Billing portal is not available — Stripe is not configured." },
        { status: 503 }
      );
    }

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "No billing record found. The portal becomes available after your first Stripe subscription.",
        },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? request.headers.get("origin") ?? "";

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/subscription`,
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    console.error("Billing portal error:", err);
    return NextResponse.json(
      { error: "Could not open billing portal. Please try again." },
      { status: 500 }
    );
  }
}
