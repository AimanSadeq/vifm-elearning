import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  const body = await request.json();

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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

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

  // Build update object — only include fields that were sent
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.body !== undefined) update.body = body.body;
  if (body.is_pinned !== undefined && (isAdmin || isInstructor))
    update.is_pinned = body.is_pinned;
  if (body.is_resolved !== undefined && (isAdmin || isInstructor || isAuthor))
    update.is_resolved = body.is_resolved;

  const { data, error } = await supabase
    .from("forum_posts")
    .update(update)
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
