import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createEnrollmentFromPayment,
  createSubscriptionFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { queryPayTabsTransaction } from "@/lib/services/paytabs";
import { incrementPromoUsage } from "@/lib/services/promo";

/**
 * PayTabs IPN webhook.
 *
 * Trust model: the request body is treated as untrusted. We extract the
 * transaction reference from it, then call PayTabs' /payment/query API
 * server-to-server to fetch the authoritative state, and provision based on
 * THAT response — never on what the IPN body itself claims.
 *
 * The IPN body comes in as `application/x-www-form-urlencoded`, not JSON
 * (PayTabs doesn't send JSON callbacks for the standard hosted page).
 */
export async function POST(request: NextRequest) {
  try {
    // PayTabs posts form-encoded fields. Older accounts can be configured to
    // post JSON; accept either by checking the content-type.
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    } else {
      const form = await request.formData().catch(() => null);
      if (form) {
        for (const [k, v] of form.entries()) {
          body[k] = typeof v === "string" ? v : v.name;
        }
      }
    }

    const tranRef =
      (body.tran_ref as string | undefined) ??
      (body.tranRef as string | undefined) ??
      null;

    if (!tranRef) {
      console.error("PayTabs callback: no tran_ref in body");
      return NextResponse.json({ received: true });
    }

    // Authoritative state — we never trust the IPN body's status flags.
    const fresh = await queryPayTabsTransaction(tranRef);
    if (!fresh) {
      console.error(
        "PayTabs callback: query API returned no data; refusing to provision",
        { tranRef }
      );
      return NextResponse.json({ received: true });
    }

    const paymentResult = fresh.payment_result as
      | Record<string, unknown>
      | undefined;
    const responseStatus = (paymentResult?.response_status as string) ?? "";
    const responseCode = (paymentResult?.response_code as string) ?? "";

    // PayTabs codes: response_status A = authorised, H = held,
    // P = pending, V = voided, E = error, D = declined.
    const isSuccess = responseStatus === "A" || responseCode === "G00000";
    const isFailure =
      responseStatus === "D" || responseStatus === "E" || responseStatus === "V";

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paytabs_transaction_ref", tranRef)
      .maybeSingle();

    if (!payment) {
      console.error("PayTabs callback: payment not found for", tranRef);
      return NextResponse.json({ received: true });
    }

    if (isFailure) {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "failed",
        paytabsTransactionRef: tranRef,
        gatewayResponse: fresh,
      });
      return NextResponse.json({ received: true });
    }

    if (!isSuccess) {
      // Pending / held — record the latest response, don't provision yet.
      await supabaseAdmin
        .from("payments")
        .update({
          metadata: {
            ...((payment.metadata as Record<string, unknown> | null) ?? {}),
            last_paytabs_query: fresh,
          },
        })
        .eq("id", payment.id);
      return NextResponse.json({ received: true });
    }

    // Idempotency — don't double-provision on retried webhook
    if (payment.status === "completed") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await updatePaymentStatus({
      paymentId: payment.id,
      status: "completed",
      paytabsTransactionRef: tranRef,
      gatewayResponse: fresh,
    });

    if (payment.promo_code_id) {
      try {
        await incrementPromoUsage(payment.promo_code_id);
      } catch (e) {
        console.warn("incrementPromoUsage failed (paytabs):", e);
      }
    }

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
