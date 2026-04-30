import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  PROTECTED_PREFIXES,
  PROTECTED_PATTERNS,
  getLocale,
  hasValidLocale,
  stripLocale,
} from "@/lib/utils/protected-paths";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- 1. Force valid locale prefix on ALL requests ---
  // This MUST happen first to prevent "admin" being treated as a locale
  if (!hasValidLocale(pathname) && pathname !== "/") {
    const locale = routing.defaultLocale;
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // --- 2. Refresh Supabase auth session ---
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const withAuthCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  // --- 3. Check if route is protected ---
  const locale = getLocale(pathname);
  const cleanPath = stripLocale(pathname);

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => cleanPath.startsWith(prefix)) ||
    PROTECTED_PATTERNS.some((pattern) => pattern.test(cleanPath));

  // Not protected → run intl middleware and return
  if (!isProtected) return withAuthCookies(intlMiddleware(request));

  // --- 4. Authentication check ---
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    const safePath =
      pathname.startsWith("/") && !pathname.startsWith("//")
        ? pathname
        : `/${locale}/dashboard`;
    loginUrl.searchParams.set("redirect", safePath);
    return withAuthCookies(NextResponse.redirect(loginUrl));
  }

  // --- 5. Role-based access control ---
  const role = (user.app_metadata?.role as string) ?? "learner";
  const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);

  if (cleanPath.startsWith("/admin") && role !== "super_admin") {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  if (
    cleanPath.startsWith("/instructor") &&
    !["super_admin", "instructor"].includes(role)
  ) {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  if (
    cleanPath.startsWith("/corporate") &&
    !["super_admin", "corporate_admin"].includes(role)
  ) {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  // --- 6. All checks passed ---
  return withAuthCookies(intlMiddleware(request));
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|assets|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|txt|xml)$).*)",
  ],
};
