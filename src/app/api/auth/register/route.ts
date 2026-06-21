/**
 * Registration.
 *
 * We don't use Supabase's client-side signUp (which would send the
 * confirmation email through Supabase's own SMTP). Instead we mint the
 * confirmation link with the service-role key via `admin.generateLink` and
 * deliver it ourselves through Microsoft Graph (Outlook). The link points at
 * /api/auth/callback, which verifies the token and provisions the profile.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "@/lib/env";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { registerSchema } from "@/lib/utils/validators";
import { buildAuthEmail } from "@/lib/services/auth-emails";
import { sendOutlookEmail } from "@/lib/services/outlook";

// Service-role client + Graph fetch — must run on the Node runtime.
export const runtime = "nodejs";

interface LinkMeta {
  full_name: string;
  phone: string | null;
  language: "en" | "ar";
}

async function generateSignupLink(
  admin: SupabaseClient,
  email: string,
  password: string,
  data: LinkMeta,
  redirectTo: string,
): Promise<string | null> {
  const res = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data, redirectTo },
  });
  if (res.error) {
    console.warn("[auth/register] generateLink:", res.error.message);
    return null;
  }
  return res.data?.properties?.hashed_token ?? null;
}

type RecycleResult =
  | { kind: "token"; token: string }
  | { kind: "confirmed" }
  | { kind: "none" };

/**
 * generateLink({type:'signup'}) fails once an account with that email exists.
 * If that account never confirmed its email (a re-signup, or a first attempt
 * whose email never arrived), recycle it so the learner can get a fresh link.
 * A *confirmed* account is a genuine duplicate — the caller tells the learner
 * to sign in instead.
 */
async function recycleUnconfirmed(
  admin: SupabaseClient,
  email: string,
  password: string,
  data: LinkMeta,
  redirectTo: string,
): Promise<RecycleResult> {
  // The handle_new_user trigger mirrors every auth user into profiles, so we
  // can resolve the id without paging the whole admin user list.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!profile?.id) return { kind: "none" };

  const { data: existing } = await admin.auth.admin.getUserById(profile.id);
  if (!existing?.user) return { kind: "none" };
  if (existing.user.email_confirmed_at) {
    console.log("[auth/register] email already confirmed telling user to sign in");
    return { kind: "confirmed" };
  }

  console.log("[auth/register] recycling unconfirmed account for resend");
  await admin.auth.admin.deleteUser(profile.id);
  const token = await generateSignupLink(admin, email, password, data, redirectTo);
  return token ? { kind: "token", token } : { kind: "none" };
}

export async function POST(request: NextRequest) {
  // Creating users + sending mail with the service-role key — throttle by IP.
  const limited = await applyRateLimit(request, {
    scope: "auth:register",
    buckets: [
      { limit: 10, windowMs: 60_000 },
      { limit: 60, windowMs: 60 * 60_000 },
    ],
  });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { email, password, fullName, phone, preferredLanguage } = parsed.data;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const metadata: LinkMeta = {
    full_name: fullName,
    phone: phone || null,
    language: preferredLanguage,
  };
  const redirectTo = `${APP_URL}/api/auth/callback`;

  let hashedToken = await generateSignupLink(
    admin,
    email,
    password,
    metadata,
    redirectTo,
  );
  if (!hashedToken) {
    const recycled = await recycleUnconfirmed(
      admin,
      email,
      password,
      metadata,
      redirectTo,
    );
    if (recycled.kind === "confirmed") {
      return NextResponse.json(
        { error: "already_registered" },
        { status: 409 },
      );
    }
    if (recycled.kind === "token") hashedToken = recycled.token;
  }

  if (!hashedToken) {
    // Lookup miss / unexpected. Return success rather than reveal anything.
    return NextResponse.json({ ok: true });
  }

  try {
    const { subject, html } = buildAuthEmail({
      user: {
        email,
        user_metadata: metadata as unknown as Record<string, unknown>,
      },
      email_data: {
        token_hash: hashedToken,
        redirect_to: redirectTo,
        email_action_type: "signup",
      },
    });
    await sendOutlookEmail({ to: email, subject, html });
    console.log("[auth/register] confirmation email sent via Outlook");
  } catch (err) {
    console.error("[auth/register] Outlook send failed:", err);
    return NextResponse.json(
      { error: "Could not send the confirmation email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
