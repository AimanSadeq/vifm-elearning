import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

import { getOwnRole } from "@/lib/supabase/own-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";
interface RouteParams {
  params: Promise<{ certificateId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { certificateId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("certificates")
      .select(
        "*, course:courses(title, title_ar, slug), user:profiles!certificates_user_id_fkey(full_name)"
      )
      .eq("id", certificateId)
      .single();

    if (error || !data)
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { certificateId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Own role — read via my_profile; `profiles.role` is not granted
    // to `authenticated` any more.
    const profile = { role: await getOwnRole(supabase) };

    if (profile?.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { status, revokeReason } = await request.json();

    if (status !== "revoked" && status !== "issued")
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const updateData: Record<string, unknown> = { status };
    if (status === "revoked") {
      updateData.revoked_at = new Date().toISOString();
      updateData.revoke_reason = revokeReason ?? null;
    } else {
      updateData.revoked_at = null;
      updateData.revoke_reason = null;
    }

    const { data, error } = await supabaseAdmin
      .from("certificates")
      .update(updateData)
      .eq("id", certificateId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
