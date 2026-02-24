import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    // Fallback if RPC doesn't exist — use raw update
    if (error) {
      await supabase
        .from("designation_documents")
        .update({
          download_count: supabase.rpc ? undefined : 0, // fallback
        })
        .eq("id", documentId);

      // Simple increment via SQL
      const { error: updateError } = await supabase.rpc("exec_sql", {
        sql: `UPDATE designation_documents SET download_count = COALESCE(download_count, 0) + 1 WHERE id = '${documentId}'`,
      });

      if (updateError) {
        console.error("Download count increment failed:", updateError);
      }
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
