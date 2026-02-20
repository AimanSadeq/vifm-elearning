"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark, BookmarkType, BookmarkColor } from "@/types";

interface UseVideoBookmarksOptions {
  userId: string;
  lessonId: string;
  courseId: string;
}

export function useVideoBookmarks({
  userId,
  lessonId,
  courseId,
}: UseVideoBookmarksOptions) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!userId || !lessonId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("lesson_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .order("timestamp_seconds", { ascending: true });

    if (data) {
      setBookmarks(data as Bookmark[]);
    }
    setLoading(false);
  }, [userId, lessonId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = useCallback(
    async (params: {
      timestampSeconds: number;
      note: string;
      bookmarkType: BookmarkType;
      color: BookmarkColor;
    }) => {
      if (!userId || !lessonId || !params.note.trim()) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("lesson_bookmarks")
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          timestamp_seconds: params.timestampSeconds,
          note: params.note,
          bookmark_type: params.bookmarkType,
          color: params.color,
        })
        .select()
        .single();

      if (data && !error) {
        setBookmarks((prev) =>
          [...prev, data as Bookmark].sort(
            (a, b) => a.timestamp_seconds - b.timestamp_seconds
          )
        );
        return data as Bookmark;
      }
      return null;
    },
    [userId, lessonId, courseId]
  );

  const updateBookmark = useCallback(
    async (
      id: string,
      updates: {
        note?: string;
        bookmarkType?: BookmarkType;
        color?: BookmarkColor;
      }
    ) => {
      const supabase = createClient();
      const updateData: Record<string, unknown> = {};
      if (updates.note !== undefined) updateData.note = updates.note;
      if (updates.bookmarkType !== undefined)
        updateData.bookmark_type = updates.bookmarkType;
      if (updates.color !== undefined) updateData.color = updates.color;

      const { data, error } = await supabase
        .from("lesson_bookmarks")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (data && !error) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === id ? (data as Bookmark) : b))
        );
      }
    },
    [userId]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("lesson_bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (!error) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    },
    [userId]
  );

  return {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    refetch: fetchBookmarks,
  };
}
