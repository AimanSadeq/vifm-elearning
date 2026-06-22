import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { syncLearnerProgress } from "@/lib/services/progress-service";

// POST /api/learner/progress/sync — recompute the caller's enrollment progress
// from lesson_progress so the dashboard / My Courses always match the player.
export const runtime = "nodejs";

export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await syncLearnerProgress(user.id);
  } catch (err) {
    console.error("[progress sync] failed:", err);
  }
  return NextResponse.json({ ok: true });
}
