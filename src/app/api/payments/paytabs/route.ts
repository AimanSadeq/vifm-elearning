import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentPage } from "@/lib/services/paytabs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, promoCode } = await request.json();
    if (!courseId)
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

    // Fetch course
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (!course)
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Calculate price with promo
    let finalPrice = Number(course.price);
    let discountAmount = 0;
    let promoCodeId: string | null = null;

    if (promoCode) {
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single();

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

    // Insert pending payment first
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: finalPrice,
        currency: course.currency,
        status: "pending",
        method: "paytabs",
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
      })
      .select()
      .single();

    if (paymentError)
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://academy.vifm.ae";

    const result = await createPaymentPage({
      amount: finalPrice,
      currency: course.currency,
      orderId: payment.id,
      description: `Enrollment: ${course.title}`,
      customerEmail: profile?.email ?? user.email ?? "",
      customerName: profile?.full_name ?? "Learner",
      callbackUrl: `${baseUrl}/api/webhooks/paytabs`,
      returnUrl: `${baseUrl}/payment/success?payment_id=${payment.id}`,
    });

    // Update payment with transaction ref
    await supabaseAdmin
      .from("payments")
      .update({
        transaction_id: result.tran_ref,
        gateway_response: result,
      })
      .eq("id", payment.id);

    return NextResponse.json({
      data: { url: result.redirect_url, paymentId: payment.id },
    });
  } catch (err) {
    console.error("PayTabs checkout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
