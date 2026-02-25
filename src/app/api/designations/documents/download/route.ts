import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    // Verify user is an active holder
    const { data: holder } = await supabase
      .from("designation_holders")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "grace_period"])
      .single();

    if (!holder) {
      return NextResponse.json({ error: "Active holder required" }, { status: 403 });
    }

    // Increment download count
    const { error } = await supabase.rpc("increment_download_count", {
      doc_id: documentId,
    });

    if (error) {
      console.error("Download count increment failed:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Download tracking error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
