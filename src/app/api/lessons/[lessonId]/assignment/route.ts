import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  getAssignmentMeta,
  getUserSubmission,
} from "@/lib/services/assignment-service";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const meta = await getAssignmentMeta(lessonId);
  if (!meta)
    return NextResponse.json(
      { error: "Not an assignment lesson" },
      { status: 404 }
    );

  const submission = await getUserSubmission(user.id, lessonId);
  return NextResponse.json({ data: { assignment: meta, submission } });
}
