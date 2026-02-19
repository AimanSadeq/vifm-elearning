"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useForumRealtime(
  courseId: string,
  onNewPost: () => void
) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`forum:${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_posts",
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          onNewPost();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, onNewPost]);
}
