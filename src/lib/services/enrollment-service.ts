import { supabaseAdmin } from "@/lib/supabase/admin";

interface CreateEnrollmentParams {
  userId: string;
  courseId: string;
  paymentId?: string;
}

export async function createEnrollmentFromPayment({
  userId,
  courseId,
  paymentId,
}: CreateEnrollmentParams) {
  // Idempotent: check if enrollment already exists
  const { data: existing } = await supabaseAdmin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .insert({
      user_id: userId,
      course_id: courseId,
      payment_id: paymentId ?? null,
      status: "active",
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create enrollment: ${error.message}`);
  return data;
}

/**
 * Create a subscription row from a successful payment whose
 * payment_type === "subscription". Reads plan info from payment.metadata
 * (we always stash plan_id, plan_type, plan_name there at creation time).
 *
 * Idempotent — won't create a second subscription if one already exists for
 * this payment's plan + user.
 */
interface CreateSubscriptionParams {
  paymentId: string;
  /** Optional Stripe IDs to attach (subscription mode); for PayTabs/bank these stay null */
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}

export async function createSubscriptionFromPayment({
  paymentId,
  stripeSubscriptionId = null,
  stripeCustomerId = null,
}: CreateSubscriptionParams) {
  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (payErr || !payment)
    throw new Error(`Payment ${paymentId} not found: ${payErr?.message}`);

  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  const planId = meta.plan_id as string | undefined;
  const planType = (meta.plan_type as string | undefined) ?? "monthly";
  if (!planId)
    throw new Error(`Payment ${paymentId} has no plan_id in metadata`);

  // Idempotent
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", payment.user_id)
    .eq("plan_id", planId)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return existing;

  // Compute current_period_end based on plan_type. Stripe webhook will refine
  // these dates later when invoice events arrive.
  const now = new Date();
  let periodEnd: Date | null = null;
  if (planType === "monthly") {
    periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (planType === "quarterly") {
    periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
  } else if (planType === "annual") {
    periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }
  // lifetime → leave periodEnd null (never expires)

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: payment.user_id,
      plan: planType,
      plan_id: planId,
      status: "active",
      price: payment.amount,
      currency: payment.currency,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd?.toISOString() ?? null,
      cancel_at_period_end: false,
      metadata: { source_payment_id: paymentId },
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create subscription: ${error.message}`);
  return data;
}

/**
 * Update a payment's status. Stores transaction references in the right
 * column based on which gateway is provided. Anything else goes into
 * metadata.gateway_response.
 */
interface UpdatePaymentParams {
  paymentId: string;
  status: "completed" | "failed" | "refunded" | "pending";
  /** Stripe Checkout Session ID (sets stripe_session_id) */
  stripeSessionId?: string;
  /** Stripe PaymentIntent ID (sets stripe_payment_intent_id) */
  stripePaymentIntentId?: string;
  /** PayTabs transaction reference (sets paytabs_transaction_ref) */
  paytabsTransactionRef?: string;
  /** Bank transfer reference (sets bank_reference) */
  bankReference?: string;
  /** Raw gateway response — merged into metadata.gateway_response */
  gatewayResponse?: Record<string, unknown>;
}

export async function updatePaymentStatus({
  paymentId,
  status,
  stripeSessionId,
  stripePaymentIntentId,
  paytabsTransactionRef,
  bankReference,
  gatewayResponse,
}: UpdatePaymentParams) {
  const updateData: Record<string, unknown> = { status };

  if (stripeSessionId) updateData.stripe_session_id = stripeSessionId;
  if (stripePaymentIntentId)
    updateData.stripe_payment_intent_id = stripePaymentIntentId;
  if (paytabsTransactionRef)
    updateData.paytabs_transaction_ref = paytabsTransactionRef;
  if (bankReference) updateData.bank_reference = bankReference;
  if (status === "completed") updateData.paid_at = new Date().toISOString();

  if (gatewayResponse) {
    // Merge into existing metadata so we don't clobber plan info
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("metadata")
      .eq("id", paymentId)
      .single();
    updateData.metadata = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      gateway_response: gatewayResponse,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("payments")
    .update(updateData)
    .eq("id", paymentId)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update payment status: ${error.message}`);
  return data;
}
