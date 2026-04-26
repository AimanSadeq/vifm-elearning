import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/payments/verify?session_id=...&payment_id=...
 *
 * Looks up the user's payment row by either Stripe session id or payment id
 * (used by PayTabs/MamoPay return URLs) and reports whether it has been marked
 * completed by the corresponding webhook. Used by /payment/success to avoid
 * showing a "success" screen for a payment that hasn't actually settled.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const paymentId = url.searchParams.get("payment_id");

  if (!sessionId && !paymentId) {
    return NextResponse.json(
      { error: "session_id or payment_id is required" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("payments")
    .select("id, status, course_id, payment_type, user_id");

  query = sessionId
    ? query.eq("stripe_session_id", sessionId)
    : query.eq("id", paymentId!);

  const { data: payment, error } = await query.maybeSingle();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // The payment row must belong to the requesting user — never reveal others' status.
  if (payment.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let courseSlug: string | null = null;
  if (payment.course_id) {
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("slug")
      .eq("id", payment.course_id)
      .single();
    courseSlug = course?.slug ?? null;
  }

  return NextResponse.json({
    status: payment.status as "pending" | "completed" | "failed" | "refunded",
    paymentType: payment.payment_type as
      | "course_purchase"
      | "subscription"
      | "designation_renewal"
      | null,
    courseSlug,
  });
}
