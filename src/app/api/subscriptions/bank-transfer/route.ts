import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validatePromoForCheckout } from "@/lib/services/promo";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const reference = `VIFM-SUB-${Date.now()}`;
    const bankDetails = {
      bankName: "First Abu Dhabi Bank (FAB)",
      accountName: "Virginia Institute of Finance and Management",
      iban: process.env.BANK_IBAN ?? "Contact admin for details",
      swiftCode: process.env.BANK_SWIFT ?? "Contact admin for details",
      reference,
    };

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        amount: finalPrice,
        currency: plan.currency,
        status: "pending",
        payment_method: "bank_transfer",
        bank_reference: reference,
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        payment_type: "subscription",
        metadata: {
          plan_id: plan.id,
          plan_type: plan.plan_type,
          plan_name: plan.name,
          bankDetails,
        },
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: {
        paymentId: payment.id,
        amount: finalPrice,
        currency: plan.currency,
        bankDetails,
        message:
          "Please transfer the amount to the bank account below using the reference number. Your subscription will be activated once we confirm the transfer.",
      },
    });
  } catch (err) {
    console.error("Subscription bank-transfer error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
