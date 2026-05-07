import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentPage } from "@/lib/services/paytabs";
import { validatePromoForCheckout } from "@/lib/services/promo";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { APP_URL } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "payments:paytabs",
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

    if (!process.env.PAYTABS_PROFILE_ID || !process.env.PAYTABS_SERVER_KEY) {
      return NextResponse.json(
        {
          error:
            "PayTabs is not configured yet. Please pick a different payment method or contact support.",
        },
        { status: 503 }
      );
    }

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
      const validated = await validatePromoForCheckout(
        promoCode,
        finalPrice,
        { courseId, client: supabaseAdmin }
      );
      if (validated) {
        promoCodeId = validated.promo.id;
        discountAmount = validated.discountAmount;
        finalPrice = validated.finalPrice;
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
        payment_method: "paytabs",
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        payment_type: "course_purchase",
      })
      .select()
      .single();

    if (paymentError)
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );

    const baseUrl = APP_URL;

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
        paytabs_transaction_ref: result.tran_ref,
        metadata: {
          ...(payment.metadata as Record<string, unknown> | null ?? {}),
          gateway_response: result,
        },
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
