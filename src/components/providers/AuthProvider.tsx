"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  EXPLICIT_SIGNOUT_FLAG,
  isProtectedPath,
  getLocale,
} from "@/lib/utils/protected-paths";
import type { Profile } from "@/types";

/**
 * Extracts the user ID from the Supabase auth cookie by decoding the JWT.
 * This bypasses Navigator Locks which can get stuck during HMR / service worker issues.
 * Handles chunked cookies (Supabase SSR splits cookies > 3180 chars into .0, .1, etc.)
 */
function getUserIdFromCookie(): string | null {
  try {
    const projectRef =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
        /https:\/\/([^.]+)\.supabase/
      )?.[1];
    if (!projectRef) return null;

    const cookieName = `sb-${projectRef}-auth-token`;

    // Try the base cookie first; if absent, concatenate chunks (.0, .1, .2, ...)
    let raw = getCookieValue(cookieName);
    if (!raw) {
      raw = "";
      let i = 0;
      let chunk: string | null;
      while ((chunk = getCookieValue(`${cookieName}.${i}`)) !== null) {
        raw += chunk;
        i++;
      }
      if (!raw) return null;
    }

    // Cookie value is base64url-encoded JSON (prefixed with "base64-")
    if (raw.startsWith("base64-")) raw = raw.slice(7);

    // Decode base64url → JSON string
    const json = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);

    // The session object stores the access_token JWT
    const accessToken: string | undefined = parsed?.access_token;
    if (!accessToken) return null;

    // Decode the JWT payload (second segment)
    const payload = JSON.parse(
      atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const resolved = useRef(false);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const supabase = createClient();
      // my_profile, not profiles: the table no longer grants email/phone/role
      // to `authenticated`, and this needs the caller's full row. The view is
      // already filtered to auth.uid(), so the userId filter is redundant.
      const { data } = await supabase.from("my_profile").select("*").maybeSingle();

      if (data) return data as Profile;

      // Profile doesn't exist — auto-create it via server route
      try {
        const res = await fetch("/api/auth/ensure-profile", { method: "POST" });
        if (res.ok) {
          const { data: newProfile } = await supabase
            .from("my_profile")
            .select("*")
            .maybeSingle();
          return newProfile as Profile | null;
        }
      } catch {
        // Silently fail — user will see empty state
      }

      return null;
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Primary: listen to auth state changes (fires INITIAL_SESSION on load).
    // Defer the profile fetch via setTimeout to avoid potential issues with
    // @supabase/ssr's Navigator Lock context during the callback.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      resolved.current = true;

      if (session?.user) {
        const userId = session.user.id;
        setTimeout(async () => {
          if (!mounted) return;
          const profile = await fetchProfile(userId);
          if (mounted) setUser(profile);
        }, 0);
      } else {
        setUser(null);
        // Session ended (refresh-token expired, server-side revocation, etc).
        // Skip the redirect when the user *deliberately* signed out — useAuth
        // sets a sentinel before calling signOut() and handles the navigation
        // itself, so a duplicate redirect here would clobber the destination.
        if (event !== "SIGNED_OUT" || typeof window === "undefined") return;
        const isExplicit =
          sessionStorage.getItem(EXPLICIT_SIGNOUT_FLAG) === "1";
        if (isExplicit) {
          sessionStorage.removeItem(EXPLICIT_SIGNOUT_FLAG);
          return;
        }
        if (window.location.pathname.includes("/login")) return;
        if (!isProtectedPath(window.location.pathname)) return;

        const currentPath = window.location.pathname + window.location.search;
        const locale = getLocale(window.location.pathname);
        // Hard nav so middleware re-runs and the stale shell unmounts cleanly.
        window.location.href =
          `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    });

    // Fallback: if onAuthStateChange hasn't fired after 1s (Navigator Lock stuck),
    // read the session directly from cookies to unblock the UI.
    const fallbackTimer = setTimeout(async () => {
      if (resolved.current || !mounted) return;

      const userId = getUserIdFromCookie();
      if (userId) {
        const profile = await fetchProfile(userId);
        if (mounted && !resolved.current) {
          resolved.current = true;
          setUser(profile);
        }
      } else {
        if (mounted && !resolved.current) {
          resolved.current = true;
          setUser(null);
        }
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, fetchProfile]);

  return <>{children}</>;
}
