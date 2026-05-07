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
      scope: "payments:mamopay",
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

    const { courseId, promoCode } = await request.json();
    if (!courseId)
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );

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

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

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

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: finalPrice,
        currency: course.currency,
        status: "pending",
        payment_method: "mamopay",
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

    const link = await createPaymentLink({
      title: `${course.title}`.slice(0, 50),
      description: course.short_description ?? undefined,
      amount: finalPrice,
      currency: course.currency,
      returnUrl: `${baseUrl}/payment/success?payment_id=${payment.id}`,
      failureReturnUrl: `${baseUrl}/courses/${course.slug}/checkout`,
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
          mamopay_link_id: link.id,
          gateway_response: link.raw,
        },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      data: { url: link.paymentUrl, paymentId: payment.id },
    });
  } catch (err) {
    console.error("MamoPay course checkout error:", err);
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
