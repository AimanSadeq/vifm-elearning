import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createEnrollmentFromPayment,
  createSubscriptionFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { incrementPromoUsage } from "@/lib/services/promo";

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

/**
 * Admin endpoint: confirm a pending payment (e.g. bank transfer that the
 * admin verified manually). Marks payment as completed and then either:
 *   - creates an enrollment (course payments)
 *   - creates a subscription (subscription payments)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { paymentId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { transactionId } = await request.json().catch(() => ({}));

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (!payment)
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );

    if (payment.status === "completed")
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 400 }
      );

    await updatePaymentStatus({
      paymentId,
      status: "completed",
      bankReference:
        transactionId ?? payment.bank_reference ?? `bank-${Date.now()}`,
    });

    if (payment.promo_code_id) {
      try {
        await incrementPromoUsage(payment.promo_code_id);
      } catch (e) {
        console.warn("incrementPromoUsage failed (admin confirm):", e);
      }
    }

    if (payment.payment_type === "subscription") {
      const sub = await createSubscriptionFromPayment({ paymentId });
      return NextResponse.json({
        data: {
          message: "Payment confirmed and subscription activated",
          subscriptionId: sub?.id,
        },
      });
    }

    if (!payment.course_id) {
      return NextResponse.json(
        {
          error:
            "Payment has no course_id and is not a subscription nothing to provision.",
        },
        { status: 400 }
      );
    }

    const enrollment = await createEnrollmentFromPayment({
      userId: payment.user_id,
      courseId: payment.course_id,
      paymentId: payment.id,
    });

    return NextResponse.json({
      data: {
        message: "Payment confirmed and enrollment created",
        enrollmentId: enrollment?.id,
      },
    });
  } catch (err) {
    console.error("Confirm payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
