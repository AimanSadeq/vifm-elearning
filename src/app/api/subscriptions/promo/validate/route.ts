import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, {
      scope: "subscription-promo:validate",
      buckets: [
        { limit: 10, windowMs: 60_000 },
        { limit: 60, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, planId } = await request.json();
    if (!code || !planId)
      return NextResponse.json(
        { error: "code and planId are required" },
        { status: 400 }
      );

    const { data: promo } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!promo)
      return NextResponse.json({
        data: { valid: false, reason: "Invalid promo code" },
      });

    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      return NextResponse.json({
        data: { valid: false, reason: "Promo code has expired" },
      });

    if (promo.max_uses && promo.current_uses >= promo.max_uses)
      return NextResponse.json({
        data: { valid: false, reason: "Promo code usage limit reached" },
      });

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("price, currency")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!plan)
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );

    const originalPrice = Number(plan.price);
    let discountAmount = 0;

    if (promo.discount_type === "percentage") {
      discountAmount = originalPrice * (Number(promo.discount_value) / 100);
    } else {
      discountAmount = Number(promo.discount_value);
    }

    if (
      promo.min_purchase_amount &&
      originalPrice < Number(promo.min_purchase_amount)
    )
      return NextResponse.json({
        data: {
          valid: false,
          reason: `Minimum purchase amount is ${promo.min_purchase_amount}`,
        },
      });

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      data: {
        valid: true,
        discountType: promo.discount_type,
        discountValue: Number(promo.discount_value),
        discountAmount,
        finalPrice,
        currency: plan.currency,
      },
    });
  } catch (err) {
    console.error("Subscription promo validate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
