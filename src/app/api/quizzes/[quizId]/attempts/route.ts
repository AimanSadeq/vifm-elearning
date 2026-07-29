import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

import { getOwnRole } from "@/lib/supabase/own-profile";
interface RouteParams {
  params: Promise<{ quizId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = { role: await getOwnRole(supabase) };

    const isAdmin = profile?.role === "super_admin";

    let query = supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;
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
