import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createEnrollmentFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tran_ref, payment_result } = body;

    if (!tran_ref)
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      );

    // Find the payment by transaction_id
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("transaction_id", tran_ref)
      .single();

    if (!payment) {
      console.error("PayTabs callback: payment not found for", tran_ref);
      return NextResponse.json({ received: true });
    }

    const isSuccess =
      payment_result?.response_status === "A" ||
      payment_result?.response_code === "G00000";

    if (isSuccess) {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "completed",
        transactionId: tran_ref,
        gatewayResponse: body,
      });

      await createEnrollmentFromPayment({
        userId: payment.user_id,
        courseId: payment.course_id,
        paymentId: payment.id,
      });
    } else {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "failed",
        transactionId: tran_ref,
        gatewayResponse: body,
      });
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
