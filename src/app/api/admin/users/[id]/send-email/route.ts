import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/services/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, body: emailBody } = body;

    if (
      typeof subject !== "string" ||
      typeof emailBody !== "string" ||
      !subject.trim() ||
      !emailBody.trim() ||
      subject.length > 200 ||
      emailBody.length > 10_000
    ) {
      return NextResponse.json(
        { error: "Subject (≤200 chars) and body (≤10000 chars) are required" },
        { status: 400 }
      );
    }

    // Fetch the recipient — we need the actual email address to deliver to.
    // Use admin client because the caller's RLS view may not include it.
    const { data: targetUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", id)
      .single();

    if (!targetUser?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // sendEmail throws in production if RESEND_API_KEY is missing — that's
    // intentional. Catch here so we return a clean 503 instead of a 500.
    try {
      const result = await sendEmail({
        to: targetUser.email,
        subject,
        body: emailBody,
      });
      return NextResponse.json({ success: result.success, id: result.id });
    } catch (err) {
      console.error("send-email: provider error", err);
      return NextResponse.json(
        {
          error:
            "Email provider not configured or rejected the request. Set RESEND_API_KEY and EMAIL_FROM on Render.",
        },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
