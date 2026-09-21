import { CATALOG_CACHE, ok } from "@/lib/api/public-read";
import { WEBINAR_PUBLIC_COLUMNS } from "@/lib/supabase/columns";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/public/webinars
 *
 * Uses the explicit public column list rather than `*`: `meeting_url` and
 * `meeting_id` are how you get into the room, and registration is what earns
 * them. They come from the `webinar_access` view instead.
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("webinars")
    .select(WEBINAR_PUBLIC_COLUMNS)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[public/webinars]", error.message);
    return ok([], { headers: CATALOG_CACHE });
  }
  return ok(data ?? [], { headers: CATALOG_CACHE });
}
