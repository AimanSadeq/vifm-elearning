import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/services/email";
import { z } from "zod";

const bulkEmailSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(500),
  voucherCode: z.string().max(200),
  courseNames: z.array(z.string().max(300)).max(50),
});

export async function POST(request: NextRequest) {
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

    const parsed = bulkEmailSchema.safeParse(
      await request.json().catch(() => ({}))
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userIds, voucherCode, courseNames } = parsed.data;

    // Resolve emails in one query — avoids the N+1 the old stub had.
    const { data: recipients } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const lookup = new Map(
      (recipients ?? [])
        .filter((r): r is { id: string; email: string; full_name: string | null } =>
          typeof r.email === "string" && r.email.length > 0
        )
        .map((r) => [r.id, r])
    );

    const subject = `Your VIFM Academy access voucher ${voucherCode}`;
    const courseList = courseNames.length
      ? courseNames.join(", ")
      : "your courses";

    const settled = await Promise.allSettled(
      userIds.map(async (id) => {
        const r = lookup.get(id);
        if (!r) return { id, status: "missing" as const };
        const body =
          `Hi ${r.full_name ?? "there"},\n\n` +
          `Your VIFM Academy account is ready. Use voucher code ${voucherCode} ` +
          `to unlock ${courseList}.\n\n` +
          `Sign in at the link in this email's footer to begin.\n\n VIFM Academy`;
        await sendEmail({ to: r.email, subject, body });
        return { id, status: "sent" as const };
      })
    );

    let sent = 0;
    let failed = 0;
    let missing = 0;
    for (const r of settled) {
      if (r.status === "fulfilled") {
        if (r.value.status === "sent") sent++;
        else missing++;
      } else {
        failed++;
        // Provider error — log but don't echo back per-recipient details.
        console.error("bulk send-email: provider error", r.reason);
      }
    }

    return NextResponse.json({ sent, failed, missing });
  } catch (err) {
    console.error("Bulk send email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
