import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/services/stripe";
import {
  createEnrollmentFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature)
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret)
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );

    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { courseId, userId, promoCodeId } = session.metadata ?? {};

      if (!courseId || !userId) {
        console.error("Missing metadata in Stripe session:", session.id);
        return NextResponse.json({ received: true });
      }

      // Find the pending payment
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("transaction_id", session.id)
        .single();

      if (payment) {
        // Update payment status
        await updatePaymentStatus({
          paymentId: payment.id,
          status: "completed",
          transactionId: session.payment_intent as string,
          gatewayResponse: {
            sessionId: session.id,
            paymentIntent: session.payment_intent,
          },
        });

        // Create enrollment
        await createEnrollmentFromPayment({
          userId,
          courseId,
          paymentId: payment.id,
        });

        // Increment promo code usage
        if (promoCodeId) {
          const { data: promo } = await supabaseAdmin
            .from("promo_codes")
            .select("current_uses")
            .eq("id", promoCodeId)
            .single();

          if (promo) {
            await supabaseAdmin
              .from("promo_codes")
              .update({ current_uses: (promo.current_uses ?? 0) + 1 })
              .eq("id", promoCodeId);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
