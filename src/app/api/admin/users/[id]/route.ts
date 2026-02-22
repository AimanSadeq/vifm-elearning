import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { userFormSchema } from "@/lib/utils/validators";

async function authenticateAdmin(request: NextRequest) {
  void request; // cookie-based auth, request not needed
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") return null;

  return profile;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate with password optional for edits
    const parsed = userFormSchema.partial({ password: true }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { password, full_name, full_name_ar, phone, role, organization_id, language, is_active } = parsed.data;

    // Update auth password if provided
    if (password) {
      const { error: pwError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { password });

      if (pwError) {
        return NextResponse.json(
          { error: `Password update failed: ${pwError.message}` },
          { status: 400 }
        );
      }
    }

    // Update profile fields
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
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Fetch updated profile
    const { data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ data: updatedProfile });
  } catch (err) {
    console.error("Admin user update error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (admin.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete auth user (cascades to profile via FK)
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin user deletion error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
