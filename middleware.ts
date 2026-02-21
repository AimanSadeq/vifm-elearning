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

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ar)/, "");

  const isProtected = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (!isProtected) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.redirect(new URL("/login", request.url));

  const role = profile.role;

  if (
    adminRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    role !== "super_admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    instructorRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    !["super_admin", "instructor"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    corporateRoutes.some((r) => pathnameWithoutLocale.startsWith(r)) &&
    !["super_admin", "corporate_admin"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets).*)"],
};
