import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsCourse } from "@/lib/services/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    const body = await request.json();
    const { course_id, title, title_ar, description, description_ar, sort_order } = body;

    if (!course_id || !title) {
      return NextResponse.json(
        { error: "course_id and title are required" },
        { status: 400 }
      );
    }

    if (!(await adminOwnsCourse(auth.admin, course_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("modules")
      .insert({
        course_id,
        title: title.trim(),
        title_ar: title_ar?.trim() || null,
        description: description?.trim() || null,
        description_ar: description_ar?.trim() || null,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Module creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Module API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
