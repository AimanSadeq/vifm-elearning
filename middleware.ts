import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = [
  "/dashboard",
  "/my-courses",
  "/courses/learn",
  "/certificates",
  "/forums",
  "/profile",
  "/notifications",
  "/admin",
  "/instructor",
  "/corporate",
];
const adminRoutes = ["/admin"];
const instructorRoutes = ["/instructor"];
const corporateRoutes = ["/corporate"];

function getLocale(pathname: string): string {
  return pathname.match(/^\/(en|ar)/)?.[1] || "en";
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
          // Update request cookies so subsequent reads see refreshed values
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

  // Helper: copy Supabase auth cookies onto any response we return
  const withAuthCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  };

  // --- 2. Run intl middleware ---
  const intlResponse = intlMiddleware(request);
  withAuthCookies(intlResponse);

  // --- 3. Check if route is protected ---
  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  const locale = getLocale(pathname);

  const isProtected = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (!isProtected) return intlResponse;

  // --- 4. Authentication check ---
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return withAuthCookies(NextResponse.redirect(loginUrl));
  }

  // --- 5. Profile & role check ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return withAuthCookies(
      NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    );
  }

  const role = profile.role;

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

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets).*)"],
};
