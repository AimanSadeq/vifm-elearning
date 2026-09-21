import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/public/site-settings
 *
 * The admin-editable settings that drive learner-facing surfaces: homepage
 * stats and hero/feature/CTA content, designation tiers, office addresses,
 * store links, quiz defaults, and the per-section / per-feature toggles.
 *
 * The existing `/api/site-settings/public` returns five keys chosen for the
 * website's own client components; the app needs more than that, and was
 * reading the whole `site_settings` table straight from PostgREST to get them.
 *
 * This is an ALLOWLIST, not a deny-list. `email_templates` and `email_from` live
 * in the same table, and a new key added by an admin must not become public
 * merely because nobody remembered to exclude it. Prefixes cover the families
 * that are public by construction (`home_section_*`, `feature_*`).
 */
const PUBLIC_KEYS = new Set([
  "homepage_stats",
  "homepage_hero",
  "homepage_cta",
  "platform_features",
  "designation_tiers",
  "offices",
  "support_email",
  "footer_app_store_url",
  "footer_google_play_url",
  "default_quiz_passing_score",
  "default_quiz_max_attempts",
]);

/** Families whose every member is learner-facing by design. */
const PUBLIC_PREFIXES = ["home_section_", "feature_"];

function isPublic(key: string): boolean {
  return PUBLIC_KEYS.has(key) || PUBLIC_PREFIXES.some((p) => key.startsWith(p));
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("site_settings").select("key, value");

  if (error) {
    console.error("[public/site-settings]", error.message);
    return ok({}, { headers: CATALOG_CACHE });
  }

  const out: Record<string, unknown> = {};
  for (const row of data ?? []) {
    const key = String(row.key);
    if (isPublic(key)) out[key] = row.value;
  }
  return ok(out, { headers: CATALOG_CACHE });
}
