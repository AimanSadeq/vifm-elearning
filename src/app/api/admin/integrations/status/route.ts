import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

import { getOwnRole } from "@/lib/supabase/own-profile";
/**
 * Admin-only: returns which payment / email / video integrations are
 * configured server-side. Doesn't leak secret values — only booleans.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = { role: await getOwnRole(supabase) };
  if (profile?.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    data: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      paytabs: Boolean(
        process.env.PAYTABS_PROFILE_ID && process.env.PAYTABS_SERVER_KEY
      ),
      mamopay: Boolean(process.env.MAMOPAY_API_KEY),
      mamopay_webhook: Boolean(process.env.MAMOPAY_WEBHOOK_SECRET),
      mamopay_env: process.env.MAMOPAY_ENV ?? "sandbox",
      zoom: Boolean(process.env.ZOOM_API_KEY || process.env.ZOOM_CLIENT_ID),
      email: Boolean(
        process.env.OUTLOOK_TENANT_ID &&
          process.env.OUTLOOK_CLIENT_ID &&
          process.env.OUTLOOK_CLIENT_SECRET &&
          process.env.OUTLOOK_SENDER_EMAIL
      ),
      badges: Boolean(
        process.env.BADGES_API_BASE_URL && process.env.BADGES_API_KEY
      ),
    },
  });
}
