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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const parentId = searchParams.get("parentId");
  const postType = searchParams.get("postType");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabase();

  // Require authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("forum_posts")
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)"
    )
    .eq("course_id", courseId);

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  if (postType && postType !== "all") {
    query = query.eq("post_type", postType);
  }

  query = query
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { courseId, lessonId, parentId, postType, title, titleAr, content, contentAr } =
    body;

  if (!courseId || !content) {
    return NextResponse.json(
      { error: "courseId and content are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      course_id: courseId,
      lesson_id: lessonId || null,
      author_id: user.id,
      parent_id: parentId || null,
      post_type: postType || "discussion",
      title: title || null,
      title_ar: titleAr || null,
      body: content,
      body_ar: contentAr || null,
    })
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment reply count on parent if this is a reply
  if (parentId) {
    try {
      await supabase.rpc("increment_reply_count", { post_id: parentId });
    } catch {
      // Function may not exist yet
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
