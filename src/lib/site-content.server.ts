import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DESIGNATION_TIERS,
  resolveTierIcon,
  type DesignationTier,
  type PersistedTier,
} from "./site-content";

/**
 * Server-side loader for admin-editable tiers. Reads site_settings and
 * rehydrates the icon component from its stored name. Falls back to
 * DESIGNATION_TIERS when the row is missing/empty/broken — so this is
 * always safe to call from a server component.
 *
 * Lives in a separate file (and uses the "server-only" guard) so that
 * importing it from a client component fails the build instead of
 * silently shipping supabaseAdmin to the browser.
 */
export async function loadDesignationTiers(): Promise<DesignationTier[]> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "designation_tiers")
      .maybeSingle();
    const rows = data?.value as PersistedTier[] | null;
    if (!Array.isArray(rows) || rows.length === 0) return DESIGNATION_TIERS;
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      labelAr: r.labelAr,
      description: r.description,
      descriptionAr: r.descriptionAr,
      icon: resolveTierIcon(r.icon),
      gradient: r.gradient,
      accentColor: r.accentColor,
      badgeColor: r.badgeColor,
    }));
  } catch {
    return DESIGNATION_TIERS;
  }
}
