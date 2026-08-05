import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { userFormSchema } from "@/lib/utils/validators";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
async function authenticateAdmin(request: NextRequest) {
  void request; // cookie-based auth, request not needed
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Own role — read via my_profile; `profiles.role` is not granted
  // to `authenticated` any more.
  const profile = { role: await getOwnRole(supabase), id: user.id };

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

    const { password, full_name, full_name_ar, phone, role, organization_id, department, language, is_active } = parsed.data;

    // Capture the pre-update role so we can write an audit row only when it
    // actually changes — role changes are privileged actions and we want a
    // trail of who escalated whom.
    const { data: priorProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", id)
      .maybeSingle();

    // Update auth password if provided
    if (password) {
      const { error: pwError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { password });

      if (pwError) {
        console.error("admin password update failed", pwError);
        const msg = pwError.message?.toLowerCase() ?? "";
        const friendly = msg.includes("password")
          ? "Password did not meet the required strength"
          : "Could not update password";
        return NextResponse.json({ error: friendly }, { status: 400 });
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
        department: department || null,
        language: language || "en",
        is_active,
      })
      .eq("id", id);

    if (updateError) {
      console.error("admin profile update failed", updateError);
      return NextResponse.json(
        { error: "Could not update profile" },
        { status: 500 }
      );
    }

    // Audit any role change. Best-effort — don't fail the response if the
    // audit insert errors out, but do log it so an alert can pick it up.
    if (priorProfile && role && priorProfile.role !== role) {
      const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
        user_id: admin.id,
        action: "user.role_changed",
        table_name: "profiles",
        record_id: id,
        old_values: { role: priorProfile.role },
        new_values: { role },
        ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
      });
      if (auditError) {
        console.error("audit_log insert failed (role change)", auditError);
      }
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Capture identifying info before the cascade nukes the profile row.
    const { data: priorProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, role")
      .eq("id", id)
      .maybeSingle();

    // Delete auth user (cascades to profile via FK)
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error("admin user delete failed", deleteError);
      return NextResponse.json(
        { error: "Could not delete user" },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
      user_id: admin.id,
      action: "user.deleted",
      table_name: "profiles",
      record_id: id,
      old_values: priorProfile ?? null,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: request.headers.get("user-agent") ?? null,
    });
    if (auditError) {
      console.error("audit_log insert failed (user delete)", auditError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin user deletion error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
