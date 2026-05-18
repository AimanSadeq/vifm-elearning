import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Public read of safe, non-sensitive editable settings used by client
 * components (admin quiz form defaults, footer app URLs, etc.).
 *
 * NEVER add anything here that should be admin-only (templates, email
 * sender, etc.) — those have separate authenticated endpoints.
 */
const PUBLIC_KEYS = [
  "default_quiz_passing_score",
  "default_quiz_max_attempts",
  "homepage_stats",
  "footer_app_store_url",
  "footer_google_play_url",
] as const;

export async function GET() {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", PUBLIC_KEYS as unknown as string[]);

  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.key as string] = row.value;
  return NextResponse.json({ data: out });
}
