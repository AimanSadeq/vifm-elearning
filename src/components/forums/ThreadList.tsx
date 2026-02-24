"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, Pin, CheckCircle, Plus, ThumbsUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThreadDetail } from "./ThreadDetail";
import { PostForm } from "./PostForm";
import { formatRelativeDate } from "@/lib/utils/formatters";
import type { ForumPost } from "@/types";

interface ThreadListProps {
  courseId: string;
  lessonId?: string;
}

type FilterTab = "all" | "question" | "discussion";

export function ThreadList({ courseId, lessonId }: ThreadListProps) {
  const locale = useLocale();
  const t = useTranslations("forums");
  const { user } = useAuth();

  const [threads, setThreads] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("forum_posts")
      .select(
        "*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)"
      )
      .eq("course_id", courseId)
      .is("parent_id", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (activeFilter !== "all") {
      query = query.eq("post_type", activeFilter);
    }

    const { data } = await query;
    setThreads((data as ForumPost[]) ?? []);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, activeFilter]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  if (selectedThread) {
    return (
      <ThreadDetail
        postId={selectedThread}
        courseId={courseId}
        onBack={() => {
          setSelectedThread(null);
          fetchThreads();
        }}
      />
    );
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "question", label: "Questions" },
    { key: "discussion", label: "Discussions" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        {user && (
          <Button size="sm" onClick={() => setShowNewPost(true)}>
            <Plus className="h-4 w-4 me-1" />
            {t("newPost")}
          </Button>
        )}
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card>
          <CardContent className="p-4">
            <PostForm
              courseId={courseId}
              lessonId={lessonId}
              mode="thread"
              onSuccess={() => {
                setShowNewPost(false);
                fetchThreads();
              }}
              onCancel={() => setShowNewPost(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Thread List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No discussions yet. Start one!
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const title =
              locale === "ar" && thread.title_ar
                ? thread.title_ar
                : thread.title;
            const authorName =
              (thread.author as unknown as { full_name: string })?.full_name ??
              "Unknown";

            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className="w-full text-start rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {thread.is_pinned && (
                        <Pin className="h-3 w-3 text-warning shrink-0" />
                      )}
                      {thread.is_resolved && (
                        <CheckCircle className="h-3 w-3 text-success shrink-0" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {thread.post_type}
                      </Badge>
                    </div>
                    <p className="font-medium truncate">
                      {title || thread.body.slice(0, 80)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {authorName} · {formatRelativeDate(thread.created_at, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {thread.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.reply_count}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
