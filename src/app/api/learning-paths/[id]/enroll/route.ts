import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/utils/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "learning-paths:enroll",
      buckets: [
        { limit: 10, windowMs: 60_000 },
        { limit: 60, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    const { id: pathId } = await params;

    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify path exists and is published
    const { data: path } = await supabase
      .from("learning_paths")
      .select("id, is_published")
      .eq("id", pathId)
      .single();

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    if (!path.is_published) {
      return NextResponse.json(
        { error: "Learning path is not available" },
        { status: 400 }
      );
    }

    // Idempotent: check for existing enrollment
    const { data: existing } = await supabase
      .from("learning_path_enrollments")
      .select("id")
      .eq("learning_path_id", pathId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from("learning_path_enrollments")
      .insert({
        learning_path_id: pathId,
        user_id: user.id,
        status: "active",
        progress: 0,
        enrolled_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to enroll: ${error.message}`);
    }

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
