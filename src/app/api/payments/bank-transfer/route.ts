import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validatePromoForCheckout } from "@/lib/services/promo";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "payments:bank-transfer",
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

    // Already enrolled? Don't create a duplicate pending payment.
    const { data: existingEnrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingEnrollment)
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 400 }
      );

    // Already an open bank-transfer for this course? Reuse it instead of
    // burning a new reference number — keeps admin reconciliation sane.
    const { data: existingPending } = await supabaseAdmin
      .from("payments")
      .select("id, amount, currency, bank_reference, metadata")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("payment_method", "bank_transfer")
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      const meta = existingPending.metadata as
        | { bankDetails?: Record<string, unknown> }
        | null;
      return NextResponse.json({
        data: {
          paymentId: existingPending.id,
          amount: existingPending.amount,
          currency: existingPending.currency,
          bankDetails: meta?.bankDetails ?? null,
          message:
            "You already have a pending bank transfer for this course. Use the same reference and we'll activate access once we confirm the deposit.",
        },
      });
    }

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

    const reference = `VIFM-${Date.now()}`;
    const bankDetails = {
      bankName: "First Abu Dhabi Bank (FAB)",
      accountName: "Virginia Institute of Finance and Management",
      iban: process.env.BANK_IBAN ?? "Contact admin for details",
      swiftCode: process.env.BANK_SWIFT ?? "Contact admin for details",
      reference,
    };

    // Create pending payment
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: finalPrice,
        currency: course.currency,
        status: "pending",
        payment_method: "bank_transfer",
        bank_reference: reference,
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        payment_type: "course_purchase",
        metadata: { bankDetails },
      })
      .select()
      .single();

    if (error) {
      console.error("bank-transfer payment insert failed", error);
      return NextResponse.json(
        { error: "Could not record bank transfer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        paymentId: payment.id,
        amount: finalPrice,
        currency: course.currency,
        bankDetails,
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
