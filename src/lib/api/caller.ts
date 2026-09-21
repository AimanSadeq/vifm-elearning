import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * The signed-in caller of an API route, resolved from EITHER a bearer token or
 * the browser session cookie.
 *
 * Every route until now resolved the caller only through `createServerSupabase()`,
 * which reads `@supabase/ssr`'s cookie. That is right for the website — the
 * browser has the cookie — but it means a non-browser client cannot authenticate
 * at all: the Flutter app was sending `Authorization: Bearer <access_token>` to
 * `/api/video/signed-url` and `/api/learner/badges`, and both answered 401 every
 * time, silently, because nothing read the header. Its only way in was to forge
 * the cookie by serialising its whole session into it — refresh token included.
 *
 * Accepting a bearer token removes the need for that. The token is verified
 * against GoTrue (`auth.getUser(jwt)`), so it is a real check, not a decode.
 */
export interface Caller {
  id: string;
  email: string | null;
  /** `app_metadata` — the JWT claim, not the self-writable `profiles.role`. */
  appMetadata: { role?: string } | null;
  /** How this caller proved who they are; useful in logs. */
  via: "bearer" | "cookie";
}

/** Returns the caller, or null when the request carries no valid credentials. */
export async function resolveCaller(request: NextRequest): Promise<Caller | null> {
  const header = request.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (token) {
      // Verified server-side against the auth server — an expired or forged
      // token fails here rather than being trusted because it parsed.
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        return {
          id: data.user.id,
          email: data.user.email ?? null,
          appMetadata: (data.user.app_metadata as { role?: string } | null) ?? null,
          via: "bearer",
        };
      }
    }
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    appMetadata: (data.user.app_metadata as { role?: string } | null) ?? null,
    via: "cookie",
  };
}

/** True when the caller holds a staff role in their JWT claim. */
export function isStaffCaller(caller: Caller | null): boolean {
  const role = caller?.appMetadata?.role;
  return role === "super_admin" || role === "instructor";
}
