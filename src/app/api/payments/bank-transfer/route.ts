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

    // Create pending payment
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: finalPrice,
        currency: course.currency,
        status: "pending",
        method: "bank_transfer",
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        metadata: {
          bankDetails: {
            bankName: "First Abu Dhabi Bank (FAB)",
            accountName: "Virginia Institute of Finance and Management",
            iban: process.env.BANK_IBAN ?? "Contact admin for details",
            swiftCode: process.env.BANK_SWIFT ?? "Contact admin for details",
            reference: `VIFM-${Date.now()}`,
          },
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
        currency: course.currency,
        bankDetails: payment.metadata?.bankDetails,
        message:
          "Please transfer the amount to the bank account below and use the reference number. Your enrollment will be activated once we confirm the transfer.",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
