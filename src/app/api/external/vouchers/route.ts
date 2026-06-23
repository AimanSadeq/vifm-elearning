import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env, APP_URL } from "@/lib/env";

/**
 * POST /api/external/vouchers
 *
 * Server-to-server endpoint used by the OpsSys training system to mint an
 * email-bound, single-use full-access voucher for one course delegate.
 *
 * Auth: shared secret in the `x-api-key` header (EXTERNAL_VOUCHER_API_KEY).
 *
 * The created voucher is:
 *   - assigned_email  → only the delegate (logged in with this email) can redeem
 *   - is_single_use / max_uses = 1 → can only ever be redeemed once
 *   - external_ref    → idempotency key, so re-sends return the SAME code
 *
 * Combined with the per-user UNIQUE(voucher,user,course) redemption constraint,
 * this guarantees the voucher cannot be shared and a user cannot "take 2".
 */

const bodySchema = z.object({
  // The delegate's email — the voucher is locked to this address.
  email: z.string().email(),
  // Idempotency key, e.g. "opssys:<courseId>:<attendeeId>".
  externalRef: z.string().min(1).max(200),
  // Optional human-readable label stored on the voucher.
  description: z.string().max(255).optional(),
  // Optional ISO expiry; omitted = never expires.
  expiresAt: z.string().datetime().optional(),
  // Optional restriction to specific e-learning course IDs; empty = any course.
  applicableCourses: z.array(z.string().uuid()).optional(),
});

async function resolveRedeemUrl(
  applicableCourses?: string[]
): Promise<string> {
  // Course-specific voucher: deep-link straight to that course's CHECKOUT so
  // the delegate lands on the enrolment page (the code is appended by the
  // caller as ?voucher= and auto-applied there).
  if (applicableCourses && applicableCourses.length === 1) {
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("slug")
      .eq("id", applicableCourses[0])
      .maybeSingle();
    if (course?.slug) return `${APP_URL}/en/courses/${course.slug}/checkout`;
  }
  // Fallback: the catalogue (generic voucher, or course not found).
  return `${APP_URL}/en/courses`;
}

export async function POST(request: NextRequest) {
  // --- Auth ---
  const expected = env.EXTERNAL_VOUCHER_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "External voucher API is not configured" },
      { status: 503 }
    );
  }
  const provided = request.headers.get("x-api-key");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse ---
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, externalRef, description, expiresAt, applicableCourses } =
    parsed.data;
  const assignedEmail = email.trim().toLowerCase();

  try {
    const baseRedeemUrl = await resolveRedeemUrl(applicableCourses);
    // Append the code so the checkout page can prefill + auto-apply it.
    const redeemUrlFor = (c: string) =>
      `${baseRedeemUrl}?voucher=${encodeURIComponent(c)}`;

    // --- Idempotency: reuse an existing voucher for this external_ref ---
    const { data: existing } = await supabaseAdmin
      .from("vouchers")
      .select("code, assigned_email")
      .eq("external_ref", externalRef)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        data: {
          code: existing.code,
          assignedEmail: existing.assigned_email,
          redeemUrl: redeemUrlFor(existing.code),
          reused: true,
        },
      });
    }

    // --- Create ---
    const code = `VIFM-${randomUUID().slice(0, 8).toUpperCase()}`;

    const { data: voucher, error: insertError } = await supabaseAdmin
      .from("vouchers")
      .insert({
        code,
        description: description || `Complimentary e-learning – ${assignedEmail}`,
        voucher_type: "full_access",
        applicable_courses: applicableCourses ?? [],
        max_uses: 1,
        current_uses: 0,
        is_single_use: true,
        is_active: true,
        expires_at: expiresAt ?? null,
        assigned_email: assignedEmail,
        external_ref: externalRef,
        // created_by intentionally null — minted by an external system, no
        // admin profile to attribute it to (column is nullable).
      })
      .select("code, assigned_email")
      .single();

    if (insertError || !voucher) {
      // Unique-violation on external_ref means a concurrent request beat us —
      // re-read and return that voucher so the caller still gets a code.
      if (insertError?.code === "23505") {
        const { data: raced } = await supabaseAdmin
          .from("vouchers")
          .select("code, assigned_email")
          .eq("external_ref", externalRef)
          .maybeSingle();
        if (raced) {
          return NextResponse.json({
            data: {
              code: raced.code,
              assignedEmail: raced.assigned_email,
              redeemUrl: redeemUrlFor(raced.code),
              reused: true,
            },
          });
        }
      }
      console.error("External voucher creation error:", insertError);
      return NextResponse.json(
        { error: "Failed to create voucher" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        code: voucher.code,
        assignedEmail: voucher.assigned_email,
        redeemUrl: redeemUrlFor(voucher.code),
        reused: false,
      },
    });
  } catch (err) {
    console.error("External voucher endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
