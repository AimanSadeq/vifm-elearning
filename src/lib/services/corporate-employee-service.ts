import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/services/email";
import { env } from "@/lib/env";

/**
 * Corporate employee provisioning, shared by /api/corporate/employees (invite)
 * and /api/corporate/employees/transfer (license transfer). Callers handle
 * authorization; organizationId must already be verified as the caller's own.
 */

export interface InviteInput {
  organizationId: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  department?: string;
  language?: string;
}

export type InviteOutcome =
  | {
      ok: true;
      data: {
        id: string;
        email: string;
        emailed: boolean;
        /** Present only when the credential email failed to send. */
        tempPassword?: string;
      };
    }
  | { ok: false; status: number; error: string; code?: string };

/** Active-profile count = seats used; matches the corporate dashboard. */
export async function seatUsage(organizationId: string) {
  const [{ count: used }, { data: org }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabaseAdmin
      .from("organizations")
      .select("max_seats")
      .eq("id", organizationId)
      .maybeSingle(),
  ]);
  return { used: used ?? 0, maxSeats: org?.max_seats ?? null };
}

function tempPassword(): string {
  // 12+ chars, mixed classes — meets typical Supabase strength settings.
  return `${randomBytes(6).toString("base64url")}!aA1`;
}

export async function inviteCorporateEmployee(
  input: InviteInput,
): Promise<InviteOutcome> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2) {
    return {
      ok: false,
      status: 400,
      error: "A valid email and full name are required",
    };
  }

  const { used, maxSeats } = await seatUsage(input.organizationId);
  if (maxSeats !== null && used >= maxSeats) {
    return {
      ok: false,
      status: 409,
      code: "SEATS_EXHAUSTED",
      error: `All ${maxSeats} seats are in use. Deactivate an employee or contact VIFM to add seats.`,
    };
  }

  const password = tempPassword();
  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createErr) {
    const msg = createErr.message?.toLowerCase() ?? "";
    return {
      ok: false,
      status: 400,
      error:
        msg.includes("already") || msg.includes("registered")
          ? "A user with this email already exists"
          : "Could not create the account",
    };
  }

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      full_name_ar: input.fullNameAr?.trim() || null,
      role: "learner",
      organization_id: input.organizationId,
      department: input.department?.trim() || null,
      language: input.language === "ar" ? "ar" : "en",
      is_active: true,
    })
    .eq("id", created.user.id);
  if (profileErr) {
    console.error("corporate invite: profile update failed", profileErr);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";
  let emailed = false;
  try {
    const sent = await sendEmail({
      to: email,
      subject: "Your VIFM Academy account",
      body:
        `Hi ${fullName},\n\n` +
        `Your organization has created a VIFM Academy learning account for you.\n\n` +
        `Sign in at: ${appUrl}/en/login\n` +
        `Email: ${email}\n` +
        `Temporary password: ${password}\n\n` +
        `Please sign in and change your password from your profile page.`,
    });
    emailed = sent.success;
  } catch (e) {
    console.error("corporate invite: credential email failed", e);
  }

  return {
    ok: true,
    data: {
      id: created.user.id,
      email,
      emailed,
      tempPassword: emailed ? undefined : password,
    },
  };
}
