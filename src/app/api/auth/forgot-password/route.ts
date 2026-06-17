/**
 * Password reset request.
 *
 * Like registration, we mint the recovery link server-side with the
 * service-role key and send it via Outlook instead of going through Supabase's
 * SMTP. The link lands on /api/auth/callback, which verifies the token and
 * redirects to the set-new-password page.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { APP_URL } from "@/lib/env";
import { applyRateLimit } from "@/lib/utils/rate-limit";
import { buildAuthEmail } from "@/lib/services/auth-emails";
import { sendOutlookEmail } from "@/lib/services/outlook";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "ar"]).default("en"),
});

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, {
    scope: "auth:forgot-password",
    buckets: [
      { limit: 5, windowMs: 60_000 },
      { limit: 30, windowMs: 60 * 60_000 },
    ],
  });
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { email, locale } = parsed.data;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const redirectTo = `${APP_URL}/api/auth/callback?next=/${locale}/reset-password`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    // No such account (or generation failed). Return success regardless so we
    // don't reveal which emails are registered. Nothing is sent.
    console.error("[auth/forgot-password] generateLink failed:", error?.message);
    return NextResponse.json({ ok: true });
  }

  try {
    const { subject, html } = buildAuthEmail({
      user: {
        email,
        // generateLink doesn't echo the user's stored language; honour the UI
        // locale the request came from.
        user_metadata: { language: locale },
      },
      email_data: {
        token_hash: hashedToken,
        redirect_to: redirectTo,
        email_action_type: "recovery",
      },
    });
    await sendOutlookEmail({ to: email, subject, html });
  } catch (err) {
    console.error("[auth/forgot-password] send failed:", err);
    return NextResponse.json(
      { error: "Could not send the reset email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
