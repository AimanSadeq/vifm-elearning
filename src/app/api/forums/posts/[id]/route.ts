import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnRole } from "@/lib/supabase/own-profile";
async function createSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

const updatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).max(20_000).optional(),
  is_pinned: z.boolean().optional(),
  is_resolved: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Fetch existing post to verify ownership or instructor role
  const { data: post } = await supabase
    .from("forum_posts")
    .select("author_id, course_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if user is the author or an instructor of the course
  const profile = { role: await getOwnRole(supabase) };

  const isAuthor = post.author_id === user.id;
  const isAdmin = profile?.role === "super_admin";

  // Check if instructor of this course
  let isInstructor = false;
  if (profile?.role === "instructor") {
    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id")
      .eq("id", post.course_id)
      .single();
    isInstructor = course?.instructor_id === user.id;
  }

  if (!isAuthor && !isAdmin && !isInstructor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build the update from a fixed allow-list. Each field is read explicitly
  // from the validated payload — never spread the raw body — so there's no
  // way a sender can sneak in an unintended column (author_id, course_id…)
  // even if the client tries.
  const update: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.body !== undefined) update.body = parsed.data.body;
  if (parsed.data.is_pinned !== undefined && (isAdmin || isInstructor))
    update.is_pinned = parsed.data.is_pinned;
  if (
    parsed.data.is_resolved !== undefined &&
    (isAdmin || isInstructor || isAuthor)
  )
    update.is_resolved = parsed.data.is_resolved;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No editable fields supplied" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .update(update)
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("forum post update failed", error);
    return NextResponse.json(
      { error: "Could not update post" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
