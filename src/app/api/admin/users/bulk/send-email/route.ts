import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
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

    // Email delivery isn't wired up yet (Resend exists in deps but no
    // server integration). Don't iterate per-user just to log PII into the
    // platform log destination — refuse the request explicitly.
    return NextResponse.json(
      {
        error:
          "Email delivery is not configured. Wire up the email provider before using this endpoint.",
      },
      { status: 503 }
    );
  } catch (err) {
    console.error("Bulk send email error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
