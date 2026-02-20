import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/services/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
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

    if (course.is_free)
      return NextResponse.json(
        { error: "This course is free, no payment needed" },
        { status: 400 }
      );

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existing)
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 400 }
      );

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

      if (
        promo &&
        (!promo.expires_at || new Date(promo.expires_at) > new Date()) &&
        (!promo.max_uses || promo.current_uses < promo.max_uses) &&
        (!promo.applicable_courses ||
          promo.applicable_courses.length === 0 ||
          promo.applicable_courses.includes(courseId))
      ) {
        promoCodeId = promo.id;
        if (promo.discount_type === "percentage") {
          discountAmount = finalPrice * (Number(promo.discount_value) / 100);
        } else {
          discountAmount = Number(promo.discount_value);
        }
        finalPrice = Math.max(0, finalPrice - discountAmount);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://academy.vifm.ae";

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase(),
            unit_amount: Math.round(finalPrice * 100),
            product_data: {
              name: course.title,
              description: course.short_description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseId,
        userId: user.id,
        promoCodeId: promoCodeId ?? "",
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${course.slug}`,
    });

    // Insert pending payment
    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      course_id: courseId,
      amount: finalPrice,
      currency: course.currency,
      status: "pending",
      method: "stripe",
      transaction_id: session.id,
      promo_code_id: promoCodeId,
      discount_amount: discountAmount,
      gateway_response: { sessionId: session.id },
    });

    return NextResponse.json({
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
