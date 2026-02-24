import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the token using admin client
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { course_id, title, title_ar, description, description_ar, sort_order } = body;

    if (!course_id || !title) {
      return NextResponse.json(
        { error: "course_id and title are required" },
        { status: 400 }
      );
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
