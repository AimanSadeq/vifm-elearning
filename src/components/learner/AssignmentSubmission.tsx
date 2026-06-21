"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Star,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type {
  AssignmentLessonMeta,
  AssignmentSubmission as TSubmission,
} from "@/types/assignment";

interface Props {
  lessonId: string;
  /** Fired when the learner just submitted — parent can refresh progress. */
  onSubmitted?: () => void;
}

interface PendingFile {
  path: string;
  name: string;
  size: number;
}

export function AssignmentSubmission({ lessonId, onSubmitted }: Props) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [meta, setMeta] = useState<AssignmentLessonMeta | null>(null);
  const [submission, setSubmission] = useState<TSubmission | null>(null);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileDownloadUrl, setFileDownloadUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/lessons/${lessonId}/assignment`);
    if (!res.ok) {
      setIsLoading(false);
      return;
    }
    const j = await res.json();
    setMeta(j.data?.assignment ?? null);
    setSubmission(j.data?.submission ?? null);
    setText(j.data?.submission?.text_response ?? "");
    if (j.data?.submission?.file_url) {
      setPendingFile({
        path: j.data.submission.file_url,
        name: j.data.submission.file_name ?? "submission",
        size: j.data.submission.file_size ?? 0,
      });
    } else {
      setPendingFile(null);
    }
    setIsLoading(false);
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve a short-lived signed URL whenever the learner has a file
  // attached so the "view your file" link works.
  useEffect(() => {
    if (!pendingFile) {
      setFileDownloadUrl(null);
      return;
    }
    fetch("/api/assignments/file-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pendingFile.path }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFileDownloadUrl(j?.url ?? null))
      .catch(() => setFileDownloadUrl(null));
  }, [pendingFile]);

  const handleFile = async (file: File) => {
    if (!meta) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100 MB");
      return;
    }
    setIsUploading(true);
    try {
      const tokenRes = await fetch("/api/assignments/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, fileName: file.name }),
      });
      if (!tokenRes.ok) {
        const j = await tokenRes.json().catch(() => ({}));
        toast.error(j.error ?? "Could not start upload");
        return;
      }
      const { path, token } = (await tokenRes.json()) as {
        path: string;
        token: string;
      };
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("assignment-submissions")
        .uploadToSignedUrl(path, token, file, { upsert: true });
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        return;
      }
      setPendingFile({ path, name: file.name, size: file.size });
      toast.success("File ready click Submit to send.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!meta) return;
    setIsSubmitting(true);
    const res = await fetch(
      `/api/lessons/${lessonId}/assignment/submissions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text_response: text || null,
          file_url: pendingFile?.path ?? null,
          file_name: pendingFile?.name ?? null,
          file_size: pendingFile?.size ?? null,
        }),
      }
    );
    setIsSubmitting(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(j.error ?? "Submission failed");
      return;
    }
    toast.success(
      submission ? "Updated your instructor will review again." : "Submitted!"
    );
    setSubmission(j.data);
    onSubmitted?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!meta) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          This isn&apos;t configured as an assignment yet.
        </CardContent>
      </Card>
    );
  }

  const isGraded = submission?.status === "graded";
  const needsRevision = submission?.status === "needs_revision";
  const canEdit = !isGraded;

  const instructions = meta.content_html;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      {instructions && (
        <Card>
          <CardContent className="prose prose-brand max-w-none dark:prose-invert py-5 whitespace-pre-wrap">
            {instructions}
          </CardContent>
        </Card>
      )}

      {/* Status banner — show grade/feedback when available */}
      {submission && (
        <Card
          className={
            isGraded
              ? "border-green-500/40 bg-green-500/5"
              : needsRevision
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-blue-500/40 bg-blue-500/5"
          }
        >
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {isGraded ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 me-1" />
                  Graded
                </Badge>
              ) : needsRevision ? (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 me-1" />
                  Needs revision
                </Badge>
              ) : (
                <Badge variant="secondary">Submitted awaiting review</Badge>
              )}
              {isGraded && meta.assignment_max_points && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {submission.grade ?? 0} / {meta.assignment_max_points}
                </span>
              )}
              {submission.submitted_at && (
                <span className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {submission.feedback && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Instructor feedback
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission form */}
      <Card>
        <CardContent className="space-y-4 py-5">
          {meta.assignment_allow_text && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? "إجابتك" : "Your response"}
                {meta.assignment_allow_file && (
                  <span className="text-xs text-muted-foreground ms-2">
                    {isAr ? "(اختياري)" : "(optional)"}
                  </span>
                )}
              </label>
              <Textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!canEdit}
                maxLength={50_000}
                placeholder={isAr ? "اكتب إجابتك هنا..." : "Type your response here..."}
              />
            </div>
          )}

          {meta.assignment_allow_file && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? "ارفع ملفاً" : "Upload a file"}
                {meta.assignment_allow_text && (
                  <span className="text-xs text-muted-foreground ms-2">
                    {isAr ? "(اختياري)" : "(optional)"}
                  </span>
                )}
              </label>
              {pendingFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pendingFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pendingFile.size > 1024 * 1024
                          ? `${(pendingFile.size / 1024 / 1024).toFixed(1)} MB`
                          : `${Math.round(pendingFile.size / 1024)} KB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {fileDownloadUrl && (
                      <a
                        href={fileDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingFile(null)}
                      >
                        Replace
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-border py-8 text-center">
                  <input
                    type="file"
                    id="assignment-file"
                    className="hidden"
                    disabled={isUploading || !canEdit}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <label
                    htmlFor="assignment-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading
                      ? isAr
                        ? "جاري الرفع..."
                        : "Uploading…"
                      : isAr
                        ? "اختر ملفاً"
                        : "Choose file"}
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isAr
                      ? "حد أقصى 100 ميغابايت"
                      : "Up to 100 MB"}
                  </p>
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : null}
                {submission
                  ? isAr
                    ? "تحديث الإجابة"
                    : "Update submission"
                  : isAr
                    ? "إرسال"
                    : "Submit assignment"}
              </Button>
            </div>
          )}
          {!canEdit && (
            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              {isAr
                ? "تم تقدير هذه الإجابة لا يمكن تعديلها."
                : "This submission has been graded it can no longer be edited."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
