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

  // Create profile — role from app_metadata (set by admin) takes priority
  const metadata = user.user_metadata;
  const appRole = user.app_metadata?.role as string | undefined;
  const { error } = await adminClient.from("profiles").insert({
    id: user.id,
    email: user.email!,
    full_name: metadata?.full_name || user.email!.split("@")[0],
    phone: metadata?.phone || null,
    language: metadata?.language || "en",
    role: appRole || metadata?.role || "learner",
  });

  if (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}
