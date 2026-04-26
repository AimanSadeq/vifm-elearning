import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createEnrollmentFromPayment,
  createSubscriptionFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import {
  fetchCharge,
  verifyWebhookSignature,
} from "@/lib/services/mamopay";

/**
 * MamoPay webhook handler.
 *
 * Trust model:
 *  - If MAMOPAY_WEBHOOK_SECRET is set, verify the X-Mamo-Signature HMAC.
 *  - Otherwise, re-fetch the charge from MamoPay's API and trust their status.
 *
 * Configure the webhook URL in MamoPay dashboard → Webhooks:
 *   https://learn.viftraining.com/api/webhooks/mamopay
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body so we can verify signature later
    const rawBody = await request.text();
    const signature = request.headers.get("x-mamo-signature");

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const verified = verifyWebhookSignature(rawBody, signature);

    // The payment we care about: MamoPay returns either a charge or link object
    // and includes our `external_id` (which is the payments.id we sent).
    const data =
      (payload.data as Record<string, unknown> | undefined) ?? payload;

    const externalId =
      (data.external_id as string) ??
      (payload.external_id as string) ??
      null;
    const chargeId =
      (data.id as string) ??
      (payload.id as string) ??
      (data.charge_id as string) ??
      null;
    const status =
      ((data.status as string) ?? (payload.status as string) ?? "")
        .toString()
        .toLowerCase();
    const event =
      ((payload.event as string) ?? (payload.type as string) ?? "")
        .toString()
        .toLowerCase();

    if (!externalId && !chargeId) {
      console.error("MamoPay webhook: no external_id / charge id in payload");
      return NextResponse.json({ received: true });
    }

    // If we couldn't HMAC-verify, do a server-side trust check by re-fetching
    // the charge from MamoPay (requires MAMOPAY_API_KEY).
    if (!verified && chargeId) {
      const fresh = await fetchCharge(chargeId);
      if (!fresh) {
        console.error(
          "MamoPay webhook: cannot verify (no signature, fetchCharge failed)"
        );
        return NextResponse.json({ received: true });
      }
      // Overlay the canonical status from Mamo onto our local view
      const freshStatus = (fresh.status as string | undefined)?.toLowerCase();
      if (freshStatus) {
        (data as Record<string, unknown>).status = freshStatus;
      }
    }

    // Locate the payment row. Prefer external_id (our payments.id).
    const { data: payment } = externalId
      ? await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("id", externalId)
          .maybeSingle()
      : await supabaseAdmin
          .from("payments")
          .select("*")
          .filter("metadata->>mamopay_link_id", "eq", chargeId ?? "")
          .maybeSingle();

    if (!payment) {
      console.error("MamoPay webhook: payment not found", {
        externalId,
        chargeId,
      });
      return NextResponse.json({ received: true });
    }

    const isSuccess =
      status === "success" ||
      status === "succeeded" ||
      status === "completed" ||
      status === "paid" ||
      event.includes("success") ||
      event.includes("paid");

    const isFailure =
      status === "failed" ||
      status === "cancelled" ||
      status === "canceled" ||
      event.includes("failed") ||
      event.includes("cancel");

    if (isFailure) {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "failed",
        gatewayResponse: payload,
      });
      return NextResponse.json({ received: true });
    }

    if (!isSuccess) {
      // Pending or unknown — record the event but don't provision yet
      await supabaseAdmin
        .from("payments")
        .update({
          metadata: {
            ...((payment.metadata as Record<string, unknown> | null) ?? {}),
            last_webhook: payload,
          },
        })
        .eq("id", payment.id);
      return NextResponse.json({ received: true });
    }

    if (payment.status === "completed") {
      // Idempotent: don't double-provision if Mamo retries the webhook
      return NextResponse.json({ received: true, idempotent: true });
    }

    await updatePaymentStatus({
      paymentId: payment.id,
      status: "completed",
      gatewayResponse: payload,
    });

    if (payment.payment_type === "subscription") {
      try {
        await createSubscriptionFromPayment({ paymentId: payment.id });
      } catch (e) {
        console.error("MamoPay → createSubscriptionFromPayment failed:", e);
      }
    } else if (payment.course_id) {
      try {
        await createEnrollmentFromPayment({
          userId: payment.user_id,
          courseId: payment.course_id,
          paymentId: payment.id,
        });
      } catch (e) {
        console.error("MamoPay → createEnrollmentFromPayment failed:", e);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("MamoPay webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
