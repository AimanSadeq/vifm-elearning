import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bulkImportSchema } from "@/lib/utils/validators";
import { randomUUID } from "crypto";

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

    // Parse and validate body
    const body = await request.json();
    const parsed = bulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { users, courseIds, accessExpiresAt, voucherDescription } = parsed.data;

    // Generate voucher code
    const voucherCode = `BULK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    // Create voucher
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from("vouchers")
      .insert({
        code: voucherCode,
        description: voucherDescription || `Bulk import – ${users.length} users`,
        voucher_type: "full_access",
        applicable_courses: courseIds,
        max_uses: users.length,
        current_uses: 0,
        is_single_use: false,
        is_active: true,
        expires_at: accessExpiresAt,
        created_by: user.id,
      })
      .select("id, code")
      .single();

    if (voucherError || !voucher) {
      console.error("Voucher creation error:", voucherError);
      return NextResponse.json(
        { error: "Failed to create voucher" },
        { status: 500 }
      );
    }

    // Batch-check existing emails
    const emails = users.map((u) => u.email.toLowerCase());
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("email", emails);

    const existingEmails = new Set(
      (existingProfiles ?? []).map((p: { email: string }) => p.email.toLowerCase())
    );

    // Process users in batches of 10
    const results: { email: string; status: "created" | "skipped" | "failed"; reason?: string; userId?: string }[] = [];

    const BATCH_SIZE = 10;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const settled = await Promise.allSettled(
        batch.map(async (u) => {
          const email = u.email.toLowerCase();

          // Skip existing users
          if (existingEmails.has(email)) {
            return { email, status: "skipped" as const, reason: "Email already exists" };
          }

          // Create auth user
          const tempPassword = randomUUID().replace(/-/g, "").slice(0, 16);
          const { data: newAuthUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
            });

          if (createError || !newAuthUser?.user) {
            return {
              email,
              status: "failed" as const,
              reason: createError?.message || "Auth creation failed",
            };
          }

          const userId = newAuthUser.user.id;

          // Update profile
          await supabaseAdmin
            .from("profiles")
            .update({
              full_name: u.fullName,
              phone: u.phone || null,
              role: "learner",
              is_active: true,
            })
            .eq("id", userId);

          // Insert voucher redemptions + enrollments for each course
          for (const courseId of courseIds) {
            await supabaseAdmin.from("voucher_redemptions").insert({
              voucher_id: voucher.id,
              user_id: userId,
              course_id: courseId,
            });

            await supabaseAdmin.from("enrollments").insert({
              user_id: userId,
              course_id: courseId,
              status: "active",
              expires_at: accessExpiresAt,
            });
          }

          return { email, status: "created" as const, userId };
        })
      );

      for (const result of settled) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({
            email: "unknown",
            status: "failed",
            reason: result.reason?.message || "Unexpected error",
          });
        }
      }
    }

    // Update voucher current_uses
    const createdCount = results.filter((r) => r.status === "created").length;
    await supabaseAdmin
      .from("vouchers")
      .update({ current_uses: createdCount })
      .eq("id", voucher.id);

    const summary = {
      total: results.length,
      created: createdCount,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    return NextResponse.json(
      { voucherCode: voucher.code, voucherId: voucher.id, results, summary },
      { status: 201 }
    );
  } catch (err) {
    console.error("Bulk import error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
