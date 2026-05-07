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

export async function POST(
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
  const voteType = body.voteType as "up" | "down";

  if (!voteType || !["up", "down"].includes(voteType)) {
    return NextResponse.json(
      { error: "voteType must be 'up' or 'down'" },
      { status: 400 }
    );
  }

  // Check for existing vote — used only to decide the action label
  // returned to the client. forum_posts.upvotes/downvotes are now
  // maintained by a DB trigger (see migration
  // 20260507_payment_idempotency_and_vote_counters.sql), so the route no
  // longer increments counters by hand. Two concurrent votes from the
  // same user used to lose-update the counters; the trigger derives them
  // from a SELECT COUNT instead, eliminating the race.
  const { data: existingVote } = await supabase
    .from("forum_votes")
    .select("vote_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote?.vote_type === voteType) {
    // Toggle off — delete; trigger recomputes counters
    await supabase
      .from("forum_votes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    return NextResponse.json({ action: "removed" });
  }

  // Insert or change vote — trigger recomputes counters
  await supabase.from("forum_votes").upsert(
    { post_id: postId, user_id: user.id, vote_type: voteType },
    { onConflict: "post_id,user_id" }
  );

  return NextResponse.json({
    action: existingVote ? "changed" : "voted",
    voteType,
  });
}
