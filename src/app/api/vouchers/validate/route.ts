import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "voucher:validate",
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

    const { code, courseId } = await request.json();
    if (!code || !courseId)
      return NextResponse.json(
        { error: "code and courseId are required" },
        { status: 400 }
      );

    // Fetch voucher
    const { data: voucher } = await supabaseAdmin
      .from("vouchers")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!voucher)
      return NextResponse.json({
        data: { valid: false, reason: "Invalid voucher code" },
      });

    // Check start date
    if (voucher.starts_at && new Date(voucher.starts_at) > new Date())
      return NextResponse.json({
        data: { valid: false, reason: "Voucher is not yet active" },
      });

    // Check expiry
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date())
      return NextResponse.json({
        data: { valid: false, reason: "Voucher has expired" },
      });

    // Check usage limit
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses)
      return NextResponse.json({
        data: { valid: false, reason: "Voucher usage limit reached" },
      });

    // Check course applicability
    if (
      voucher.applicable_courses &&
      voucher.applicable_courses.length > 0 &&
      !voucher.applicable_courses.includes(courseId)
    )
      return NextResponse.json({
        data: {
          valid: false,
          reason: "Voucher not applicable to this course",
        },
      });

    // Check if user already redeemed this voucher for this course
    const { data: existingRedemption } = await supabaseAdmin
      .from("voucher_redemptions")
      .select("id")
      .eq("voucher_id", voucher.id)
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existingRedemption)
      return NextResponse.json({
        data: {
          valid: false,
          reason: "You have already used this voucher for this course",
        },
      });

    // For discount vouchers, calculate the discount
    let discountAmount = 0;
    let finalPrice = 0;

    if (voucher.voucher_type !== "full_access") {
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

      if (voucher.voucher_type === "percentage") {
        discountAmount =
          originalPrice * (Number(voucher.discount_value) / 100);
      } else {
        discountAmount = Number(voucher.discount_value);
      }

      finalPrice = Math.max(0, originalPrice - discountAmount);
    }

    return NextResponse.json({
      data: {
        valid: true,
        voucherId: voucher.id,
        voucherType: voucher.voucher_type,
        discountValue: voucher.discount_value
          ? Number(voucher.discount_value)
          : null,
        discountAmount,
        finalPrice,
        currency: voucher.currency,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
