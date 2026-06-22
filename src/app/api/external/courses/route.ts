import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

/**
 * GET /api/external/courses
 *
 * Server-to-server endpoint that lists published courses so the OpsSys training
 * system can show a course picker when minting a course-specific voucher.
 *
 * Auth: shared secret in the `x-api-key` header (EXTERNAL_VOUCHER_API_KEY).
 */
export async function GET(request: NextRequest) {
  const expected = env.EXTERNAL_VOUCHER_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "External voucher API is not configured" },
      { status: 503 }
    );
  }
  const provided = request.headers.get("x-api-key");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("id, title, slug, price, currency")
      .eq("status", "published")
      .order("title", { ascending: true });

    if (error) {
      console.error("External courses list error:", error);
      return NextResponse.json(
        { error: "Failed to list courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("External courses endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
