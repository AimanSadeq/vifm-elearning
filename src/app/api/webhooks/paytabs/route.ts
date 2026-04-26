import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createEnrollmentFromPayment,
  createSubscriptionFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { verifyPayTabsCallback } from "@/lib/services/paytabs";
import { incrementPromoUsage } from "@/lib/services/promo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature before processing
    if (!verifyPayTabsCallback(body)) {
      console.error("PayTabs callback: invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const { tran_ref, payment_result } = body;

    if (!tran_ref)
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      );

    // Look up payment by the correct column.
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paytabs_transaction_ref", tran_ref)
      .maybeSingle();

    if (!payment) {
      console.error("PayTabs callback: payment not found for", tran_ref);
      return NextResponse.json({ received: true });
    }

    const isSuccess =
      payment_result?.response_status === "A" ||
      payment_result?.response_code === "G00000";

    if (!isSuccess) {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "failed",
        paytabsTransactionRef: tran_ref,
        gatewayResponse: body,
      });
      return NextResponse.json({ received: true });
    }

    // Idempotency — don't double-provision on retried webhook
    if (payment.status === "completed") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await updatePaymentStatus({
      paymentId: payment.id,
      status: "completed",
      paytabsTransactionRef: tran_ref,
      gatewayResponse: body,
    });

    if (payment.promo_code_id) {
      try {
        await incrementPromoUsage(payment.promo_code_id);
      } catch (e) {
        console.warn("incrementPromoUsage failed (paytabs):", e);
      }
    }

    // Branch on payment_type so subs and courses each get the right follow-up.
    if (payment.payment_type === "subscription") {
      try {
        await createSubscriptionFromPayment({ paymentId: payment.id });
      } catch (e) {
        console.error("Failed to create subscription from PayTabs payment:", e);
      }
    } else if (payment.course_id) {
      try {
        await createEnrollmentFromPayment({
          userId: payment.user_id,
          courseId: payment.course_id,
          paymentId: payment.id,
        });
      } catch (e) {
        console.error("Failed to create enrollment from PayTabs payment:", e);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("PayTabs webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
