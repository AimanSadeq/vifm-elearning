import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentPage } from "@/lib/services/paytabs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.PAYTABS_PROFILE_ID || !process.env.PAYTABS_SERVER_KEY) {
      return NextResponse.json(
        {
          error:
            "PayTabs is not configured yet. Please pick a different payment method or contact support.",
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
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promo) {
        promoCodeId = promo.id;
        if (promo.discount_type === "percentage") {
          discountAmount = finalPrice * (Number(promo.discount_value) / 100);
        } else {
          discountAmount = Number(promo.discount_value);
        }
        finalPrice = Math.max(0, finalPrice - discountAmount);
      }
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: finalPrice,
        currency: plan.currency,
        status: "pending",
        payment_method: "paytabs",
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
      process.env.NEXT_PUBLIC_APP_URL ?? "https://learn.viftraining.com";

    const result = await createPaymentPage({
      amount: finalPrice,
      currency: plan.currency,
      orderId: payment.id,
      description: `Subscription: ${plan.name}`,
      customerEmail: profile?.email ?? user.email ?? "",
      customerName: profile?.full_name ?? "Subscriber",
      callbackUrl: `${baseUrl}/api/webhooks/paytabs`,
      returnUrl: `${baseUrl}/subscription?success=true&payment_id=${payment.id}`,
    });

    await supabaseAdmin
      .from("payments")
      .update({
        paytabs_transaction_ref: result.tran_ref,
        metadata: {
          plan_id: plan.id,
          plan_type: plan.plan_type,
          plan_name: plan.name,
          gateway_response: result,
        },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      data: { url: result.redirect_url, paymentId: payment.id },
    });
  } catch (err) {
    console.error("Subscription PayTabs error:", err);
    return NextResponse.json(
      { error: "Failed to start PayTabs checkout. Please try again." },
      { status: 500 }
    );
  }
}
