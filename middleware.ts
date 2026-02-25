import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = [
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

// Dynamic route patterns that also require auth
const protectedPatterns = [
  /^\/courses\/[^/]+\/learn/,
  /^\/courses\/[^/]+\/checkout/,
];

const adminRoutes = ["/admin"];
const instructorRoutes = ["/instructor"];
const corporateRoutes = ["/corporate"];

function getLocale(pathname: string): string {
  const segment = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(segment)
    ? segment
    : routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // --- 1. Refresh Supabase auth session (following official Supabase pattern) ---
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

  // Helper: copy Supabase auth cookies onto any response
  const withAuthCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  // --- 2. Check if route is protected ---
  const { pathname } = request.nextUrl;
  const locale = getLocale(pathname);
  const localePrefix = new RegExp(
    `^\\/(${(routing.locales as readonly string[]).join("|")})`
  );
  const pathnameWithoutLocale = pathname.replace(localePrefix, "");

  const isProtected =
    protectedRoutes.some((route) =>
      pathnameWithoutLocale.startsWith(route)
    ) ||
    protectedPatterns.some((pattern) => pattern.test(pathnameWithoutLocale));

  // --- 3. If not protected, run intl middleware and return ---
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

  // --- 5. Role from JWT app_metadata (synced via DB trigger, no query needed) ---
  const role = (user.app_metadata?.role as string) ?? "learner";

  // --- 6. Role-based access control ---
  const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);

  if (
    adminRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    role !== "super_admin"
  ) {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  if (
    instructorRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    !["super_admin", "instructor"].includes(role)
  ) {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  if (
    corporateRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    !["super_admin", "corporate_admin"].includes(role)
  ) {
    return withAuthCookies(NextResponse.redirect(dashboardUrl));
  }

  // --- 7. All checks passed, run intl middleware ---
  return withAuthCookies(intlMiddleware(request));
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|assets|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|txt|xml)$).*)",
  ],
};
