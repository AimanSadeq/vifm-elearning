import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/services/stripe";
import { APP_URL } from "@/lib/env";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { holderId } = await request.json();

    if (!holderId) {
      return NextResponse.json({ error: "holderId is required" }, { status: 400 });
    }

    // Fetch holder with designation and tier info
    const { data: holder, error: holderError } = await supabase
      .from("designation_holders")
      .select(
        `
        id,
        user_id,
        status,
        member_number,
        current_period_end,
        tier:designation_tiers!designation_holders_tier_id_fkey(
          slug, renewal_fee
        ),
        designation:designations!designation_holders_designation_id_fkey(
          id, name, abbreviation, renewal_fee, founding_fee, late_fee, currency
        )
      `
      )
      .eq("id", holderId)
      .eq("user_id", user.id)
      .single();

    if (holderError || !holder) {
      return NextResponse.json({ error: "Holder not found" }, { status: 404 });
    }

    const h = holder as unknown as {
      status: string;
      member_number: string;
      tier: { slug: string; renewal_fee: number }[];
      designation: {
        id: string;
        name: string;
        abbreviation: string;
        renewal_fee: number;
        founding_fee: number;
        late_fee: number;
        currency: string;
      }[];
    };
    const tier = h.tier?.[0];
    const designation = h.designation?.[0];

    // Validate status allows renewal
    if (!["active", "grace_period", "suspended"].includes(h.status)) {
      return NextResponse.json(
        { error: "Current status does not allow renewal" },
        { status: 400 }
      );
    }

    // Calculate fees
    const isFounding = tier?.slug === "founding-member";
    const isGrace = h.status === "grace_period";
    const isSuspended = h.status === "suspended";

    const baseFee = isFounding
      ? (designation?.founding_fee ?? 50)
      : (tier?.renewal_fee ?? designation?.renewal_fee ?? 70);

    const lateFee = isGrace || isSuspended ? (designation?.late_fee ?? 30) : 0;
    const totalAmount = baseFee + lateFee;
    const currency = (designation?.currency ?? "USD").toLowerCase();

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency,
          product_data: {
            name: `${designation?.abbreviation ?? "CDIP"} Annual Renewal`,
            description: `${designation?.name ?? "Designation"} — ${isFounding ? "Founding Member" : "Standard"} tier`,
          },
          unit_amount: Math.round(baseFee * 100),
        },
        quantity: 1,
      },
    ];

    if (lateFee > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: "Late Renewal Fee",
            description: isGrace
              ? "Grace period late fee"
              : "Reinstatement fee",
          },
          unit_amount: Math.round(lateFee * 100),
        },
        quantity: 1,
      });
    }

    // Fetch or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Check if user already has a Stripe customer ID in subscriptions
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile?.email ?? user.email,
        name: profile?.full_name ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout Session. NEVER use the request Origin header
    // here — it's attacker-controlled in cross-site fetches and can be
    // pointed at a phishing domain that mirrors our checkout flow. APP_URL
    // is the only trustworthy origin.
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: lineItems,
      success_url: `${APP_URL}/en/dashboard/designations?renewed=true`,
      cancel_url: `${APP_URL}/en/dashboard/designations/renew?cancelled=true`,
      metadata: {
        type: "designation_renewal",
        holder_id: holder.id,
        designation_id: designation?.id,
        user_id: user.id,
        member_number: h.member_number,
        base_fee: baseFee.toString(),
        late_fee: lateFee.toString(),
        total_amount: totalAmount.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Renewal checkout error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
