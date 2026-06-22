import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/voucher-redemptions
 *
 * Admin-only view of WHO redeemed WHICH voucher for WHICH course (the
 * voucher_redemptions table is otherwise never surfaced in the UI — the
 * vouchers page only shows aggregate current_uses).
 *
 * Uses the service-role client so it isn't blocked by per-table RLS on
 * profiles/courses. Auth is enforced here via the super_admin check.
 *
 * Query params: ?page=<0-based>  ?pageSize=<n, default 25>
 */
export async function GET(request: NextRequest) {
  // --- Auth: super_admin only ---
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Pagination ---
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, Number(searchParams.get("page")) || 0);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 25)
  );
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await supabaseAdmin
      .from("voucher_redemptions")
      .select(
        `
        id,
        redeemed_at,
        voucher:vouchers ( code, assigned_email, description ),
        user:profiles ( email, full_name ),
        course:courses ( title, slug )
        `,
        { count: "exact" }
      )
      .order("redeemed_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Voucher redemptions query error:", error);
      return NextResponse.json(
        { error: "Failed to load redemptions" },
        { status: 500 }
      );
    }

    // Flatten the nested rows into a table-friendly shape.
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      redeemedAt: r.redeemed_at,
      voucherCode: r.voucher?.code ?? "—",
      assignedEmail: r.voucher?.assigned_email ?? null,
      userEmail: r.user?.email ?? "—",
      userName: r.user?.full_name ?? "—",
      courseTitle: r.course?.title ?? "—",
    }));

    return NextResponse.json({ data: rows, count: count ?? 0 });
  } catch (err) {
    console.error("Voucher redemptions endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
