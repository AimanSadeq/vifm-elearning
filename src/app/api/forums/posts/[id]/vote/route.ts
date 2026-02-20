import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function createSupabase() {
  const cookieStore = cookies();
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = params.id;
  const body = await request.json();
  const voteType = body.voteType as "up" | "down";

  if (!voteType || !["up", "down"].includes(voteType)) {
    return NextResponse.json(
      { error: "voteType must be 'up' or 'down'" },
      { status: 400 }
    );
  }

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from("forum_votes")
    .select("vote_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote?.vote_type === voteType) {
    // Remove vote (toggle off)
    await supabase
      .from("forum_votes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    // Update post counts
    const { data: post } = await supabase
      .from("forum_posts")
      .select("upvotes, downvotes")
      .eq("id", postId)
      .single();

    if (post) {
      const updates =
        voteType === "up"
          ? { upvotes: Math.max(0, (post.upvotes as number) - 1) }
          : { downvotes: Math.max(0, (post.downvotes as number) - 1) };
      await supabase
        .from("forum_posts")
        .update(updates)
        .eq("id", postId);
    }

    return NextResponse.json({ action: "removed" });
  }

  // Upsert vote
  await supabase.from("forum_votes").upsert(
    { post_id: postId, user_id: user.id, vote_type: voteType },
    { onConflict: "post_id,user_id" }
  );

  // Update post counts
  const { data: post } = await supabase
    .from("forum_posts")
    .select("upvotes, downvotes")
    .eq("id", postId)
    .single();

  if (post) {
    const updates: Record<string, number> = {};

    if (voteType === "up") {
      updates.upvotes = (post.upvotes || 0) + 1;
      if (existingVote?.vote_type === "down") {
        updates.downvotes = Math.max(0, (post.downvotes || 0) - 1);
      }
    } else {
      updates.downvotes = (post.downvotes || 0) + 1;
      if (existingVote?.vote_type === "up") {
        updates.upvotes = Math.max(0, (post.upvotes || 0) - 1);
      }
    }

    await supabase.from("forum_posts").update(updates).eq("id", postId);
  }

  return NextResponse.json({
    action: existingVote ? "changed" : "voted",
    voteType,
  });
}
