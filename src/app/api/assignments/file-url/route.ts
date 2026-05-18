import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Issue a short-lived signed download URL for a submission file.
 * Admins can view any file; learners only their own.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const path = typeof body.path === "string" ? body.path : null;
  if (!path)
    return NextResponse.json({ error: "path required" }, { status: 400 });

  const isAdmin = user.app_metadata?.role === "super_admin";
  // Files are stored under `${user.id}/...` — easy ownership check.
  if (!isAdmin && !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("assignment-submissions")
    .createSignedUrl(path, 60 * 10); // 10 min

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
