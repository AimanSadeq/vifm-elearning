import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createEnrollmentFromPayment,
  updatePaymentStatus,
} from "@/lib/services/enrollment-service";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: { paymentId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { transactionId } = await request.json();

    // Fetch the payment
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", params.paymentId)
      .single();

    if (!payment)
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );

    if (payment.status === "completed")
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 400 }
      );

    // Update payment
    await updatePaymentStatus({
      paymentId: params.paymentId,
      status: "completed",
      transactionId: transactionId ?? `bank-${Date.now()}`,
    });

    // Create enrollment
    await createEnrollmentFromPayment({
      userId: payment.user_id,
      courseId: payment.course_id,
      paymentId: payment.id,
    });

    return NextResponse.json({
      data: { message: "Payment confirmed and enrollment created" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
