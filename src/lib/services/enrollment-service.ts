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
    .single();

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

interface UpdatePaymentParams {
  paymentId: string;
  status: "completed" | "failed" | "refunded";
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
}

export async function updatePaymentStatus({
  paymentId,
  status,
  transactionId,
  gatewayResponse,
}: UpdatePaymentParams) {
  const updateData: Record<string, unknown> = { status };

  if (transactionId) updateData.transaction_id = transactionId;
  if (gatewayResponse) updateData.gateway_response = gatewayResponse;
  if (status === "completed") updateData.paid_at = new Date().toISOString();

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
