import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentLink } from "@/lib/services/mamopay";
import { validatePromoForCheckout } from "@/lib/services/promo";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { APP_URL } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "subscriptions:mamopay",
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
        { error: "Subscription plan not found" },
        { status: 404 }
      );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    let finalPrice = Number(plan.price);
    let discountAmount = 0;
    let promoCodeId: string | null = null;

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
      }
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: finalPrice,
        currency: plan.currency,
        status: "pending",
        payment_method: "mamopay",
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        payment_type: "subscription",
        metadata: {
          plan_id: plan.id,
          plan_type: plan.plan_type,
          plan_name: plan.name,
        },
      })
      .select()
      .single();
    if (paymentError)
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );

    const baseUrl =
      APP_URL;

    const link = await createPaymentLink({
      title: `Subscription: ${plan.name}`.slice(0, 50),
      description: plan.description ?? undefined,
      amount: finalPrice,
      currency: plan.currency,
      returnUrl: `${baseUrl}/subscription?success=true&payment_id=${payment.id}`,
      failureReturnUrl: `${baseUrl}/subscription/checkout?plan=${plan.id}`,
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
          plan_id: plan.id,
          plan_type: plan.plan_type,
          plan_name: plan.name,
          mamopay_link_id: link.id,
          gateway_response: link.raw,
        },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      data: { url: link.paymentUrl, paymentId: payment.id },
    });
  } catch (err) {
    console.error("MamoPay subscription checkout error:", err);
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
