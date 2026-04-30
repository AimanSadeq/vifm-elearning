import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { userFormSchema } from "@/lib/utils/validators";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Verify auth via cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify super_admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = userFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, full_name, full_name_ar, phone, role, organization_id, language, is_active } = parsed.data;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required when creating a user" },
        { status: 400 }
      );
    }

    // Create auth user via admin client
    const { data: newAuthUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      // Translate the most common known cases to user-facing strings;
      // anything else gets a generic message so we don't leak Supabase
      // internals (auth provider config, raw DB errors).
      console.error("admin createUser failed", createError);
      const msg = createError.message?.toLowerCase() ?? "";
      const friendly =
        msg.includes("already") || msg.includes("registered")
          ? "A user with this email already exists"
          : msg.includes("password")
            ? "Password did not meet the required strength"
            : "Could not create user";
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    // Update the auto-created profile row with additional fields
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        full_name_ar: full_name_ar || null,
        phone: phone || null,
        role,
        organization_id: organization_id || null,
        language: language || "en",
        is_active,
      })
      .eq("id", newAuthUser.user.id);

    if (updateError) {
      console.error("Profile update error after user creation:", updateError);
    }

    // Fetch the complete profile to return
    const { data: createdProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", newAuthUser.user.id)
      .single();

    return NextResponse.json({ data: createdProfile }, { status: 201 });
  } catch (err) {
    console.error("Admin user creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
