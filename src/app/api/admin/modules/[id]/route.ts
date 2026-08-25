import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authorizeAdmin, adminOwnsModule } from "@/lib/services/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;

    const auth = await authorizeAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error.error }, { status: auth.error.status });
    }

    if (!(await adminOwnsModule(auth.admin, moduleId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, title_ar, description, description_ar } = body;

    const titleEn = typeof title === "string" ? title.trim() : "";
    const titleArVal = typeof title_ar === "string" ? title_ar.trim() : "";

    if (!titleEn && !titleArVal) {
      return NextResponse.json(
        { error: "At least one of title/title_ar is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modules")
      .update({
        title: titleEn || null,
        title_ar: titleArVal || null,
        description: typeof description === "string" ? description.trim() || null : null,
        description_ar:
          typeof description_ar === "string" ? description_ar.trim() || null : null,
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Module update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Module API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
