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
import { incrementPromoUsage } from "@/lib/services/promo";

/**
 * MamoPay webhook handler.
 *
 * Trust model — we provision ONLY when we have one of:
 *   (a) HMAC-SHA256 signature matches MAMOPAY_WEBHOOK_SECRET, OR
 *   (b) we re-fetch the charge from MamoPay's API and Mamo itself reports
 *       the charge as successful.
 *
 * Anything else is silently dropped (200 received, but no provision) so
 * the gateway doesn't keep retrying.
 *
 * Configure the webhook URL in MamoPay dashboard → Webhooks:
 *   https://learn.viftraining.com/api/webhooks/mamopay
 */
export async function POST(request: NextRequest) {
  try {
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

    const verifiedBySignature = verifyWebhookSignature(rawBody, signature);

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

    if (!externalId && !chargeId) {
      console.error("MamoPay webhook: no external_id / charge id in payload");
      return NextResponse.json({ received: true });
    }

    // Determine the *trusted* status. If signature is good, use the body's
    // status. Otherwise re-fetch the charge from Mamo and use Mamo's status
    // — never trust the request body.
    let trustedStatus: string | null = null;

    if (verifiedBySignature) {
      const bodyStatus =
        ((data.status as string) ?? (payload.status as string) ?? "")
          .toString()
          .toLowerCase();
      trustedStatus = bodyStatus || null;
    } else if (chargeId) {
      const fresh = await fetchCharge(chargeId);
      if (!fresh) {
        console.error(
          "MamoPay webhook: cannot verify (no signature, fetchCharge failed)",
          { externalId, chargeId }
        );
        return NextResponse.json({ received: true });
      }
      trustedStatus = ((fresh.status as string) ?? "").toString().toLowerCase();
    } else {
      // Neither HMAC nor a chargeId we can re-fetch → can't trust anything.
      console.error(
        "MamoPay webhook: unsigned payload with no chargeId — refusing to provision"
      );
      return NextResponse.json({ received: true });
    }

    // Locate the payment row. Prefer external_id (= our payments.id). When
    // it's missing we fall back to the link id stashed in metadata; a missing
    // chargeId here is impossible because the early-return at the top of
    // this handler exits when both ids are absent.
    const { data: payment } = externalId
      ? await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("id", externalId)
          .maybeSingle()
      : chargeId
        ? await supabaseAdmin
            .from("payments")
            .select("*")
            .filter("metadata->>mamopay_link_id", "eq", chargeId)
            .maybeSingle()
        : { data: null };

    if (!payment) {
      console.error("MamoPay webhook: payment not found", {
        externalId,
        chargeId,
      });
      return NextResponse.json({ received: true });
    }

    // Decide success/failure ONLY from trustedStatus. The body's `event`
    // string is attacker-controlled until proven otherwise, and even an
    // HMAC-verified body can carry an event name that disagrees with the
    // status — we trust the status field exclusively.
    const isSuccess =
      trustedStatus === "success" ||
      trustedStatus === "succeeded" ||
      trustedStatus === "completed" ||
      trustedStatus === "paid";

    const isFailure =
      trustedStatus === "failed" ||
      trustedStatus === "cancelled" ||
      trustedStatus === "canceled";

    if (isFailure) {
      await updatePaymentStatus({
        paymentId: payment.id,
        status: "failed",
        gatewayResponse: payload,
      });
      return NextResponse.json({ received: true });
    }

    if (!isSuccess) {
      // Pending or unknown — record but don't provision yet
      await supabaseAdmin
        .from("payments")
        .update({
          metadata: {
            ...((payment.metadata as Record<string, unknown> | null) ?? {}),
            last_webhook: payload,
            last_trusted_status: trustedStatus,
          },
        })
        .eq("id", payment.id);
      return NextResponse.json({ received: true });
    }

    // Idempotency — Mamo retries on transient errors
    if (payment.status === "completed") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await updatePaymentStatus({
      paymentId: payment.id,
      status: "completed",
      gatewayResponse: payload,
    });

    if (payment.promo_code_id) {
      try {
        await incrementPromoUsage(payment.promo_code_id);
      } catch (e) {
        console.warn("incrementPromoUsage failed (mamopay):", e);
      }
    }

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
