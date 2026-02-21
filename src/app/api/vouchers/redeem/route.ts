import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createEnrollmentFromPayment } from "@/lib/services/enrollment-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { voucherId, courseId } = await request.json();
    if (!voucherId || !courseId)
      return NextResponse.json(
        { error: "voucherId and courseId are required" },
        { status: 400 }
      );

    // Re-validate the voucher (prevent race conditions)
    const { data: voucher } = await supabaseAdmin
      .from("vouchers")
      .select("*")
      .eq("id", voucherId)
      .eq("is_active", true)
      .single();

    if (!voucher)
      return NextResponse.json(
        { error: "Voucher not found or inactive" },
        { status: 404 }
      );

    // Check start date
    if (voucher.starts_at && new Date(voucher.starts_at) > new Date())
      return NextResponse.json(
        { error: "Voucher is not yet active" },
        { status: 400 }
      );

    // Check expiry
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date())
      return NextResponse.json(
        { error: "Voucher has expired" },
        { status: 400 }
      );

    // Check usage limit
    if (voucher.max_uses && voucher.current_uses >= voucher.max_uses)
      return NextResponse.json(
        { error: "Voucher usage limit reached" },
        { status: 400 }
      );

    // Check course applicability
    if (
      voucher.applicable_courses &&
      voucher.applicable_courses.length > 0 &&
      !voucher.applicable_courses.includes(courseId)
    )
      return NextResponse.json(
        { error: "Voucher not applicable to this course" },
        { status: 400 }
      );

    // Check if already redeemed by this user for this course
    const { data: existingRedemption } = await supabaseAdmin
      .from("voucher_redemptions")
      .select("id")
      .eq("voucher_id", voucher.id)
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existingRedemption)
      return NextResponse.json(
        { error: "You have already used this voucher for this course" },
        { status: 400 }
      );

    // Verify course exists and is published
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id, title, price, currency, status")
      .eq("id", courseId)
      .single();

    if (!course || course.status !== "published")
      return NextResponse.json(
        { error: "Course not found or not available" },
        { status: 404 }
      );

    let paymentId: string | null = null;

    if (voucher.voucher_type === "full_access") {
      // Full access: create a $0 payment record + enrollment directly
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: 0,
          currency: course.currency,
          status: "completed",
          method: "voucher",
          discount_amount: Number(course.price),
          paid_at: new Date().toISOString(),
          metadata: {
            voucher_id: voucher.id,
            voucher_code: voucher.code,
            voucher_type: voucher.voucher_type,
            original_price: Number(course.price),
          },
        })
        .select("id")
        .single();

      if (paymentError)
        throw new Error(`Failed to create payment: ${paymentError.message}`);

      paymentId = payment.id;

      // Create enrollment
      await createEnrollmentFromPayment({
        userId: user.id,
        courseId,
        paymentId: payment.id,
      });
    }
    // For discount vouchers (percentage/fixed_amount), the payment goes through
    // Stripe/PayTabs — the redemption is recorded but enrollment happens after payment

    // Record the redemption
    const { error: redemptionError } = await supabaseAdmin
      .from("voucher_redemptions")
      .insert({
        voucher_id: voucher.id,
        user_id: user.id,
        course_id: courseId,
        payment_id: paymentId,
      });

    if (redemptionError)
      throw new Error(
        `Failed to record voucher redemption: ${redemptionError.message}`
      );

    // Increment current_uses
    const { error: updateError } = await supabaseAdmin
      .from("vouchers")
      .update({ current_uses: voucher.current_uses + 1 })
      .eq("id", voucher.id);

    if (updateError)
      throw new Error(
        `Failed to update voucher usage: ${updateError.message}`
      );

    return NextResponse.json({
      data: {
        success: true,
        voucherType: voucher.voucher_type,
        enrolled: voucher.voucher_type === "full_access",
        paymentId,
      },
    });
  } catch (err) {
    console.error("Voucher redeem error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
