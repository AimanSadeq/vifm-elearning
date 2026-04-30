import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPostSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().nullish(),
  parentId: z.string().uuid().nullish(),
  postType: z.enum(["discussion", "question", "announcement"]).optional(),
  title: z.string().min(1).max(300).nullish(),
  titleAr: z.string().min(1).max(300).nullish(),
  content: z.string().min(1).max(20_000),
  contentAr: z.string().max(20_000).nullish(),
});

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
    console.error("forum posts list failed", error);
    return NextResponse.json(
      { error: "Could not load posts" },
      { status: 500 }
    );
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const {
    courseId,
    lessonId,
    parentId,
    postType,
    title,
    titleAr,
    content,
    contentAr,
  } = parsed.data;

  const { data, error } = await supabase
    .from("forum_posts")
    .insert({
      course_id: courseId,
      lesson_id: lessonId ?? null,
      author_id: user.id,
      parent_id: parentId ?? null,
      post_type: postType ?? "discussion",
      title: title ?? null,
      title_ar: titleAr ?? null,
      body: content,
      body_ar: contentAr ?? null,
    })
    .select(
      "*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)"
    )
    .single();

  if (error) {
    console.error("forum post create failed", error);
    return NextResponse.json(
      { error: "Could not create post" },
      { status: 500 }
    );
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
