"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, Pin, CheckCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteButton } from "./VoteButton";
import { PostForm } from "./PostForm";
import { formatRelativeDate } from "@/lib/utils/formatters";
import type { ForumPost } from "@/types";

interface ThreadDetailProps {
  postId: string;
  courseId: string;
  onBack: () => void;
}

export function ThreadDetail({ postId, courseId, onBack }: ThreadDetailProps) {
  const locale = useLocale();
  const t = useTranslations("forums");
  const { user } = useAuth();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    const supabase = createClient();

    const [postRes, repliesRes] = await Promise.all([
      supabase
        .from("forum_posts")
        .select("*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)")
        .eq("id", postId)
        .single(),
      supabase
        .from("forum_posts")
        .select("*, author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)")
        .eq("parent_id", postId)
        .order("created_at", { ascending: true }),
    ]);

    setPost(postRes.data as ForumPost | null);
    setReplies((repliesRes.data as ForumPost[]) ?? []);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  if (isLoading || !post) {
    return null;
  }

  const title = locale === "ar" && post.title_ar ? post.title_ar : post.title;
  const body = locale === "ar" && post.body_ar ? post.body_ar : post.body;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        &larr; {t("discussions")}
      </Button>

      {/* Main post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_pinned && (
                  <Badge variant="warning">
                    <Pin className="h-3 w-3 me-1" />
                    {t("pinned")}
                  </Badge>
                )}
                {post.is_resolved && (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 me-1" />
                    {t("resolved")}
                  </Badge>
                )}
                <Badge variant="outline">{post.post_type}</Badge>
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {(post.author as unknown as { full_name: string })?.full_name ?? "Unknown"}{" "}
                · {formatRelativeDate(post.created_at, locale)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm">{body}</div>
          {user && (
            <VoteButton
              postId={post.id}
              userId={user.id}
              upvotes={post.upvotes}
              downvotes={post.downvotes}
            />
          )}
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {t("replies")} ({replies.length})
        </h3>

        {replies.map((reply) => {
          const replyBody = locale === "ar" && reply.body_ar ? reply.body_ar : reply.body;
          const authorName =
            (reply.author as unknown as { full_name: string })?.full_name ?? "Unknown";

          return (
            <Card
              key={reply.id}
              className={reply.is_instructor_answer ? "border-success/50 bg-success/5" : ""}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{authorName}</span>
                  {reply.is_instructor_answer && (
                    <Badge variant="success">
                      <Shield className="h-3 w-3 me-1" />
                      {t("instructorAnswer")}
                    </Badge>
                  )}
                  <span>· {formatRelativeDate(reply.created_at, locale)}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm">{replyBody}</div>
                {user && (
                  <VoteButton
                    postId={reply.id}
                    userId={user.id}
                    upvotes={reply.upvotes}
                    downvotes={reply.downvotes}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reply form */}
      {user && (
        <div>
          {showReplyForm ? (
            <Card>
              <CardContent className="p-4">
                <PostForm
                  courseId={courseId}
                  parentId={postId}
                  mode="reply"
                  onSuccess={() => {
                    setShowReplyForm(false);
                    fetchThread();
                  }}
                  onCancel={() => setShowReplyForm(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowReplyForm(true)}>
              <MessageSquare className="h-4 w-4 me-2" />
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
