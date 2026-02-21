"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    console.log("[AuthProvider] useEffect running, setting up listeners");

    // Primary: listen to auth state changes (fires INITIAL_SESSION on load)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] onAuthStateChange fired:", event, !!session?.user);
      if (!mounted) return;
      resolved.current = true;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
    });

    // Fallback: if onAuthStateChange hasn't fired after 1s (Navigator Lock stuck),
    // read the session directly from cookies to unblock the UI.
    const fallbackTimer = setTimeout(async () => {
      console.log("[AuthProvider] Fallback timer fired, resolved:", resolved.current, "mounted:", mounted);
      if (resolved.current || !mounted) return;

      const userId = getUserIdFromCookie();
      console.log("[AuthProvider] Cookie fallback userId:", userId);
      if (userId) {
        const profile = await fetchProfile(userId);
        console.log("[AuthProvider] Cookie fallback profile:", !!profile);
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
