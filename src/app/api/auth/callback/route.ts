import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function GET(request: NextRequest) {
  // Anyone can hit this with arbitrary `?code=` values; on success we run
  // admin-client SQL to provision a profile. Throttle by IP to stop a
  // compromised/anon caller from looping it.
  const limited = applyRateLimit(request, {
    scope: "auth:callback",
    buckets: [
      { limit: 10, windowMs: 60_000 },
      { limit: 60, windowMs: 60 * 60_000 },
    ],
  });
  if (limited) return limited;

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = (() => {
    if (!rawNext) return "/en/dashboard";
    try {
      const resolved = new URL(rawNext, origin);
      return resolved.origin === origin
        ? resolved.pathname + resolved.search
        : "/en/dashboard";
    } catch {
      return "/en/dashboard";
    }
  })();

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if profile already exists, if not create one
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Use service role client to bypass RLS for profile creation
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          // user_metadata is user-writable (set during signup, OAuth, or
          // any client-side updateUser call). Copying it raw would let
          // anyone stuff XSS into full_name, bloat the row via phone, or
          // try to set role. Apply the same safety net as ensure-profile.
          const metadata = user.user_metadata;
          const appRole = user.app_metadata?.role as string | undefined;
          const allowedRoles = [
            "learner",
            "instructor",
            "admin",
            "super_admin",
            "corporate_admin",
          ];
          const role =
            appRole && allowedRoles.includes(appRole) ? appRole : "learner";

          const safeFullName =
            typeof metadata?.full_name === "string" && metadata.full_name.trim()
              ? metadata.full_name.trim().slice(0, 200)
              : user.email!.split("@")[0];
          const phoneRaw =
            typeof metadata?.phone === "string" ? metadata.phone.trim() : "";
          const phoneOk =
            phoneRaw && /^[+\d\s().-]{4,32}$/.test(phoneRaw);
          const language = metadata?.language === "ar" ? "ar" : "en";

          const { error: insertError } = await adminClient
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email!,
              full_name: safeFullName,
              phone: phoneOk ? phoneRaw : null,
              language,
              role,
            });

          if (insertError) {
            console.error("Profile creation error:", insertError);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/en/login?error=auth_callback_failed`);
}
