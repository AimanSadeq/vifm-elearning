import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, courseId } = await request.json();
    if (!code || !courseId)
      return NextResponse.json(
        { error: "code and courseId are required" },
        { status: 400 }
      );

    // Fetch promo code
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

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      return NextResponse.json({
        data: { valid: false, reason: "Promo code has expired" },
      });

    // Check usage limit
    if (promo.max_uses && promo.current_uses >= promo.max_uses)
      return NextResponse.json({
        data: { valid: false, reason: "Promo code usage limit reached" },
      });

    // Check course applicability
    if (
      promo.applicable_courses &&
      promo.applicable_courses.length > 0 &&
      !promo.applicable_courses.includes(courseId)
    )
      return NextResponse.json({
        data: {
          valid: false,
          reason: "Promo code not applicable to this course",
        },
      });

    // Get course price
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("price, currency")
      .eq("id", courseId)
      .single();

    if (!course)
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );

    const originalPrice = Number(course.price);
    let discountAmount = 0;

    if (promo.discount_type === "percentage") {
      discountAmount = originalPrice * (Number(promo.discount_value) / 100);
    } else {
      discountAmount = Number(promo.discount_value);
    }

    // Check minimum purchase
    if (promo.min_purchase_amount && originalPrice < Number(promo.min_purchase_amount))
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
        currency: course.currency,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
