import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Issue a Supabase signed-upload URL into the assignment-submissions
 * bucket, scoped to a path the learner owns (their auth.uid() prefix).
 * The RLS policy on the bucket enforces ownership so even with the
 * signed URL nobody can write outside their own folder.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const lessonId =
    typeof body.lessonId === "string" ? body.lessonId : null;
  const fileName =
    typeof body.fileName === "string"
      ? body.fileName.slice(0, 200)
      : "submission";
  if (!lessonId)
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  // Sanitize the filename — keep extension but strip path separators.
  const safe = fileName.replace(/[\\/]+/g, "_").replace(/\s+/g, "_");
  const path = `${user.id}/${lessonId}/${Date.now()}-${safe}`;

  const { data, error } = await supabaseAdmin.storage
    .from("assignment-submissions")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
