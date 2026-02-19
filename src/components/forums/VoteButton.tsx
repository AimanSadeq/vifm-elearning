"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface VoteButtonProps {
  postId: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  currentVote?: "up" | "down" | null;
}

export function VoteButton({
  postId,
  userId,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  currentVote: initialVote,
}: VoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(
    initialVote ?? null
  );

  const handleVote = async (voteType: "up" | "down") => {
    const supabase = createClient();

    if (currentVote === voteType) {
      // Remove vote
      await supabase
        .from("forum_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (voteType === "up") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
      setCurrentVote(null);

      // Update post counts
      await supabase
        .from("forum_posts")
        .update({
          upvotes: voteType === "up" ? upvotes - 1 : upvotes,
          downvotes: voteType === "down" ? downvotes - 1 : downvotes,
        })
        .eq("id", postId);
    } else {
      // Upsert vote
      await supabase.from("forum_votes").upsert(
        { post_id: postId, user_id: userId, vote_type: voteType },
        { onConflict: "post_id,user_id" }
      );

      if (currentVote === "up") setUpvotes((v) => v - 1);
      if (currentVote === "down") setDownvotes((v) => v - 1);
      if (voteType === "up") setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
      setCurrentVote(voteType);

      const newUp =
        upvotes + (voteType === "up" ? 1 : 0) - (currentVote === "up" ? 1 : 0);
      const newDown =
        downvotes + (voteType === "down" ? 1 : 0) - (currentVote === "down" ? 1 : 0);

      await supabase
        .from("forum_posts")
        .update({ upvotes: newUp, downvotes: newDown })
        .eq("id", postId);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 px-2", currentVote === "up" && "text-success")}
        onClick={() => handleVote("up")}
      >
        <ThumbsUp className="h-4 w-4 me-1" />
        {upvotes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 px-2", currentVote === "down" && "text-error")}
        onClick={() => handleVote("down")}
      >
        <ThumbsDown className="h-4 w-4 me-1" />
        {downvotes}
      </Button>
    </div>
  );
}
