import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DESIGNATIONS!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    // Only process designation renewals
    if (metadata?.type !== "designation_renewal") {
      return NextResponse.json({ received: true });
    }

    const holderId = metadata.holder_id;
    const designationId = metadata.designation_id;
    const userId = metadata.user_id;
    const baseFee = parseFloat(metadata.base_fee || "0");
    const lateFee = parseFloat(metadata.late_fee || "0");
    const totalAmount = parseFloat(metadata.total_amount || "0");

    try {
      const supabase = createAdminClient();

      // 1. Fetch current holder to determine new period
      const { data: holder } = await supabase
        .from("designation_holders")
        .select("current_period_end, designation_id")
        .eq("id", holderId)
        .single();

      if (!holder) {
        console.error("Holder not found:", holderId);
        return NextResponse.json({ error: "Holder not found" }, { status: 404 });
      }

      // Calculate new period: extends from current period end (or now if lapsed)
      const currentEnd = holder.current_period_end
        ? new Date(holder.current_period_end)
        : new Date();
      const newStart = currentEnd < new Date() ? new Date() : currentEnd;
      const newEnd = new Date(newStart);
      newEnd.setFullYear(newEnd.getFullYear() + 1);

      // 2. Insert payment record
      const { data: payment } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          amount: totalAmount,
          currency: "USD",
          status: "completed",
          method: "stripe",
          transaction_id: session.payment_intent as string,
          gateway_response: {
            session_id: session.id,
            customer_id: session.customer,
          },
          payment_type: "designation_renewal",
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      // 3. Insert renewal record
      await supabase.from("designation_renewals").insert({
        holder_id: holderId,
        payment_id: payment?.id,
        period_start: newStart.toISOString(),
        period_end: newEnd.toISOString(),
        amount_paid: totalAmount,
        late_fee_applied: lateFee > 0,
        status: "completed",
        renewed_at: new Date().toISOString(),
      });

      // 4. Update holder status
      await supabase
        .from("designation_holders")
        .update({
          status: "active",
          current_period_start: newStart.toISOString(),
          current_period_end: newEnd.toISOString(),
          last_renewed_at: new Date().toISOString(),
        })
        .eq("id", holderId);

      // 5. Send renewal confirmation email
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: profile.email,
              template: "designation-renewal-confirmation",
              data: {
                name: profile.full_name,
                memberNumber: metadata.member_number,
                amount: totalAmount,
                periodStart: newStart.toISOString(),
                periodEnd: newEnd.toISOString(),
              },
            }),
          });
        }
      } catch (emailErr) {
        // Log but don't fail the webhook
        console.error("Renewal confirmation email failed:", emailErr);
      }

      console.log(`Renewal completed for holder ${holderId}`);
    } catch (dbError: any) {
      console.error("Database error processing renewal:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
