import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.supabase
    .from("courses")
    .select("id, title, title_ar, slug, badge_template_external_id")
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
