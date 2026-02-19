import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: { certificateId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabase();
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
      .eq("id", params.certificateId)
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
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

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
      .eq("id", params.certificateId)
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
