"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { forumPostSchema, type ForumPostInput } from "@/lib/utils/validators";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

interface PostFormProps {
  courseId: string;
  lessonId?: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  mode?: "thread" | "reply";
}

export function PostForm({
  courseId,
  lessonId,
  parentId,
  onSuccess,
  onCancel,
  mode = "thread",
}: PostFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForumPostInput>({
    resolver: zodResolver(forumPostSchema),
    defaultValues: {
      courseId,
      lessonId: lessonId || undefined,
      parentId: parentId || undefined,
      postType: parentId ? "discussion" : "question",
      title: "",
      body: "",
    },
  });

  const onSubmit = async (data: ForumPostInput) => {
    if (!user) return;
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("forum_posts").insert({
      course_id: data.courseId,
      lesson_id: data.lessonId || null,
      author_id: user.id,
      parent_id: data.parentId || null,
      post_type: data.postType,
      title: data.title || null,
      title_ar: data.titleAr || null,
      body: data.body,
      content_ar: data.bodyAr || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Increment reply count on parent
    if (data.parentId) {
      try {
        await supabase.rpc("increment_reply_count", { post_id: data.parentId });
      } catch {
        // Function may not exist yet, safe to ignore
      }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {mode === "thread" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="postType">Type</Label>
            <select
              id="postType"
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
              )}
              {...register("postType")}
            >
              <option value="question">Question</option>
              <option value="discussion">Discussion</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What's your question or topic?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-error">{errors.title.message}</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="body">{mode === "reply" ? "Reply" : "Details"} *</Label>
        <Textarea
          id="body"
          placeholder={
            mode === "reply"
              ? "Write your reply..."
              : "Provide more details about your question or topic..."
          }
          rows={mode === "reply" ? 3 : 5}
          {...register("body")}
        />
        {errors.body && (
          <p className="text-sm text-error">{errors.body.message}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {mode === "reply" ? "Post Reply" : "Post"}
        </Button>
      </div>
    </form>
  );
}
