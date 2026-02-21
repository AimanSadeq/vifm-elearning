import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/services/stripe";
import {
  createEnrollmentFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Subscription helpers
// ---------------------------------------------------------------------------
async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session
) {
  const { userId, planId, planType } = session.metadata ?? {};
  if (!userId || !planId) return;

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer as Stripe.Customer | null)?.id ?? null;

  // Fetch plan details for price
  const { data: plan } = await supabaseAdmin
    .from("subscription_plans")
    .select("price, currency")
    .eq("id", planId)
    .single();

  // Idempotent: check for existing subscription record
  if (stripeSubscriptionId) {
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .single();
    if (existing) return;
  }

  const now = new Date().toISOString();

  await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    plan: planType ?? "monthly",
    plan_id: planId,
    status: "active",
    price: plan?.price ?? 0,
    currency: plan?.currency ?? "USD",
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    current_period_start: now,
    current_period_end: null, // will be set by subscription.updated event
    cancel_at_period_end: false,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!sub) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status === "active" ? "active" : "past_due",
      current_period_start: new Date(
        subscription.items.data[0]?.current_period_start
          ? subscription.items.data[0].current_period_start * 1000
          : Date.now()
      ).toISOString(),
      current_period_end: new Date(
        subscription.items.data[0]?.current_period_end
          ? subscription.items.data[0].current_period_end * 1000
          : Date.now()
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("id", sub.id);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // The invoice object may have subscription as a string ID or expanded object
  const inv = invoice as unknown as Record<string, unknown>;
  const subField = inv.subscription;
  const stripeSubId =
    typeof subField === "string"
      ? subField
      : (subField as Record<string, unknown> | null)?.id as string | null;

  if (!stripeSubId) return;

  const periodStart = inv.period_start as number | undefined;
  const periodEnd = inv.period_end as number | undefined;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : undefined,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : undefined,
    })
    .eq("stripe_subscription_id", stripeSubId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as unknown as Record<string, unknown>;
  const subField = inv.subscription;
  const stripeSubId =
    typeof subField === "string"
      ? subField
      : (subField as Record<string, unknown> | null)?.id as string | null;

  if (!stripeSubId) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", stripeSubId);
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------
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

    // ---- checkout.session.completed ----
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const isSubscription =
        session.mode === "subscription" ||
        session.metadata?.type === "subscription";

      if (isSubscription) {
        await handleSubscriptionCheckout(session);
      } else {
        // Existing one-time payment logic
        const { courseId, userId, promoCodeId } = session.metadata ?? {};

        if (!courseId || !userId) {
          console.error(
            "Missing metadata in Stripe session:",
            session.id
          );
          return NextResponse.json({ received: true });
        }

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("transaction_id", session.id)
          .single();

        if (payment) {
          await updatePaymentStatus({
            paymentId: payment.id,
            status: "completed",
            transactionId: session.payment_intent as string,
            gatewayResponse: {
              sessionId: session.id,
              paymentIntent: session.payment_intent,
            },
          });

          await createEnrollmentFromPayment({
            userId,
            courseId,
            paymentId: payment.id,
          });

          if (promoCodeId) {
            const { data: promo } = await supabaseAdmin
              .from("promo_codes")
              .select("current_uses")
              .eq("id", promoCodeId)
              .single();

            if (promo) {
              await supabaseAdmin
                .from("promo_codes")
                .update({
                  current_uses: (promo.current_uses ?? 0) + 1,
                })
                .eq("id", promoCodeId);
            }
          }
        }
      }
    }

    // ---- customer.subscription.updated ----
    if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
    }

    // ---- customer.subscription.deleted ----
    if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );
    }

    // ---- invoice.paid ----
    if (event.type === "invoice.paid") {
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
    }

    // ---- invoice.payment_failed ----
    if (event.type === "invoice.payment_failed") {
      await handleInvoicePaymentFailed(
        event.data.object as Stripe.Invoice
      );
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
