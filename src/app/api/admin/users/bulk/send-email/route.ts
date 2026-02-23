import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const bulkEmailSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  voucherCode: z.string(),
  courseNames: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Verify auth via cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify super_admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userIds, voucherCode, courseNames } = parsed.data;

    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const { data: targetUser } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      if (!targetUser) {
        failed++;
        continue;
      }

      // Stub: log to console instead of sending
      console.log(
        `[BULK EMAIL STUB] To: ${targetUser.email} (${targetUser.full_name}), ` +
          `Voucher: ${voucherCode}, Courses: ${courseNames.join(", ")}`
      );
      sent++;
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("Bulk send email error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
