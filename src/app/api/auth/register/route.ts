/**
 * Registration.
 *
 * We don't use Supabase's client-side signUp (which would send the
 * confirmation email through Supabase's own SMTP). Instead we mint the
 * confirmation link with the service-role key via `admin.generateLink` and
 * deliver it ourselves through Microsoft Graph (Outlook). The link points at
 * /api/auth/callback, which verifies the token and provisions the profile.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "@/lib/env";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { registerSchema } from "@/lib/utils/validators";
import { buildAuthEmail } from "@/lib/services/auth-emails";
import { sendOutlookEmail } from "@/lib/services/outlook";

// Service-role client + Graph fetch — must run on the Node runtime.
export const runtime = "nodejs";

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

  const metadata = {
    full_name: fullName,
    phone: phone || null,
    language: preferredLanguage,
  };

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: metadata,
      redirectTo: `${APP_URL}/api/auth/callback`,
    },
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // Most common cause is "email already registered". Don't reveal which —
    // return success so we don't leak which addresses have accounts. Nothing
    // is sent in that case.
    console.error("[auth/register] generateLink failed:", error?.message);
    return NextResponse.json({ ok: true });
  }

  try {
    const { subject, html } = buildAuthEmail({
      user: { email, user_metadata: metadata },
      email_data: {
        token_hash: hashedToken,
        redirect_to: `${APP_URL}/api/auth/callback`,
        email_action_type: "signup",
      },
    });
    await sendOutlookEmail({ to: email, subject, html });
  } catch (err) {
    console.error("[auth/register] send failed:", err);
    return NextResponse.json(
      { error: "Could not send the confirmation email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
