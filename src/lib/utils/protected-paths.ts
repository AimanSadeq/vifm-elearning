import { routing } from "@/i18n/routing";

/**
 * Auth-required URL prefixes — must stay in sync between the middleware
 * (server-side gate) and any client-side redirect logic (AuthProvider).
 * Keeping the list in one place avoids the drift the third code review
 * caught (e.g. middleware had `/courses/[id]/learn` but AuthProvider
 * didn't, so learners mid-lesson weren't redirected on session expiry).
 */
export const PROTECTED_PREFIXES: readonly string[] = [
  "/dashboard",
  "/my-courses",
  "/my-learning-paths",
  "/certificates",
  "/forums",
  "/profile",
  "/notifications",
  "/payment",
  "/subscription",
  "/admin",
  "/instructor",
  "/corporate",
];

export const PROTECTED_PATTERNS: readonly RegExp[] = [
  /^\/courses\/[^/]+\/learn/,
  /^\/courses\/[^/]+\/checkout/,
];

const VALID_LOCALES = routing.locales as readonly string[];

/**
 * Removes a leading `/<locale>` segment if present, leaving a path that's
 * directly comparable to the protected lists above.
 */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (
    segments.length > 1 &&
    VALID_LOCALES.includes(segments[1] as (typeof VALID_LOCALES)[number])
  ) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

export function getLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (
    segments.length > 1 &&
    VALID_LOCALES.includes(segments[1] as (typeof VALID_LOCALES)[number])
  ) {
    return segments[1];
  }
  return routing.defaultLocale;
}

export function hasValidLocale(pathname: string): boolean {
  const segments = pathname.split("/");
  return (
    segments.length > 1 &&
    VALID_LOCALES.includes(segments[1] as (typeof VALID_LOCALES)[number])
  );
}

export function isProtectedPath(pathname: string): boolean {
  const cleanPath = stripLocale(pathname);
  return (
    PROTECTED_PREFIXES.some((p) => cleanPath.startsWith(p)) ||
    PROTECTED_PATTERNS.some((p) => p.test(cleanPath))
  );
}

/**
 * sessionStorage key the manual sign-out flow sets *before* calling
 * `supabase.auth.signOut()`. The AuthProvider's SIGNED_OUT listener checks
 * for this flag and skips its own redirect (otherwise both the listener and
 * `useAuth.signOut`'s `router.push` race, and the listener's redirect URL
 * sends the user back to the protected page they explicitly chose to leave).
 */
export const EXPLICIT_SIGNOUT_FLAG = "vifm:explicit-signout";
