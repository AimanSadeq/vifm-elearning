import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { issueCertificate } from "@/lib/services/certificate-service";
import { escapeIlike } from "@/lib/utils/escape-search";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
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

    const isAdmin = profile?.role === "super_admin";

    const params = request.nextUrl.searchParams;
    const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(params.get("pageSize") ?? "25") || 25)
    );
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("certificates")
      .select(
        "*, course:courses(title, title_ar, slug), user:profiles!certificates_user_id_fkey(full_name)",
        { count: "exact" }
      )
      .order("issued_at", { ascending: false })
      .range(from, to);

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const search = params.get("search");
    if (search) {
      const s = escapeIlike(search);
      query = query.or(
        `certificate_number.ilike.%${s}%,verification_code.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, count: count ?? 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
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

    const { userId, courseId } = await request.json();
    if (!userId || !courseId)
      return NextResponse.json(
        { error: "userId and courseId are required" },
        { status: 400 }
      );

    // Find enrollment
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!enrollment)
      return NextResponse.json(
        { error: "No enrollment found" },
        { status: 400 }
      );

    const certificate = await issueCertificate({
      userId,
      courseId,
      enrollmentId: enrollment.id,
    });

    return NextResponse.json({ data: certificate }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
