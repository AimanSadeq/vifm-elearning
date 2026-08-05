import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client, created lazily on first use. Module-level creation used
 * to throw "supabaseKey is required" at import time in local dev (where
 * SUPABASE_SERVICE_ROLE_KEY isn't set), which broke every route that merely
 * imported a file in this module's dependency chain. Now the error surfaces
 * only when a code path actually uses the admin client.
 */
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set."
      );
    }
    _client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
