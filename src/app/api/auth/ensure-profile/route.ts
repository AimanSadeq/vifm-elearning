import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role client to bypass RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if profile already exists
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ created: false });
  }

  // Role MUST come from app_metadata (admin-controlled) only.
  // user_metadata is user-writable and trusting it = privilege escalation.
  const metadata = user.user_metadata;
  const appRole = user.app_metadata?.role as string | undefined;
  const allowedRoles = ["learner", "instructor", "admin", "super_admin", "corporate_admin"];
  const role = appRole && allowedRoles.includes(appRole) ? appRole : "learner";

  // user_metadata is user-writable, so anything we copy from it must be size-
  // capped and (where applicable) shape-validated. Otherwise an attacker can
  // stuff XSS-friendly markup into full_name, bloat the row with megabytes
  // of phone, etc., and we'd render that into admin dashboards.
  const safeFullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim().slice(0, 200)
      : user.email!.split("@")[0];
  const phoneRaw = typeof metadata?.phone === "string" ? metadata.phone.trim() : "";
  // Permissive phone shape: digits, spaces, +, -, parentheses; max 32 chars.
  const phoneOk = phoneRaw && /^[+\d\s().-]{4,32}$/.test(phoneRaw);
  const language = metadata?.language === "ar" ? "ar" : "en";

  const { error } = await adminClient.from("profiles").insert({
    id: user.id,
    email: user.email!,
    full_name: safeFullName,
    phone: phoneOk ? phoneRaw : null,
    language,
    role,
  });

  if (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}
