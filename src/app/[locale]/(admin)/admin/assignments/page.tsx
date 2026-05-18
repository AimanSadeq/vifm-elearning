"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Star,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { AdminSubmissionRow } from "@/types/assignment";

type StatusFilter = "submitted" | "graded" | "needs_revision" | "all";

export default function AdminAssignmentsPage() {
  const [rows, setRows] = useState<AdminSubmissionRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState<AdminSubmissionRow | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(
      `/api/admin/assignments/submissions?status=${statusFilter}`,
    );
    const j = await res.json();
    setRows(j.data ?? []);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AdminSubmissionRow>[] = [
    {
      key: "learner",
      header: "Learner",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">{r.user?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.user?.email}</p>
        </div>
      ),
    },
    {
      key: "lesson",
      header: "Assignment",
      render: (r) => (
        <div>
          <p className="text-sm">{r.lesson?.title ?? "Untitled"}</p>
          <p className="text-xs text-muted-foreground">{r.course?.title ?? ""}</p>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {new Date(r.submitted_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              r.status === "graded"
                ? "success"
                : r.status === "needs_revision"
                  ? "destructive"
                  : "secondary"
            }
          >
            {r.status.replace("_", " ")}
          </Badge>
          {r.status === "graded" && r.lesson?.assignment_max_points != null && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {r.grade ?? 0}/{r.lesson.assignment_max_points}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActive(r)}
        >
          {r.status === "submitted" ? "Review & grade" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Assignment Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grade learner work and leave feedback.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["submitted", "graded", "needs_revision", "all"] as StatusFilter[]).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {rows.length} submission{rows.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(r) => r.id}
              emptyMessage={
                statusFilter === "submitted"
                  ? "No pending submissions."
                  : "Nothing here."
              }
            />
          )}
        </CardContent>
      </Card>

      {active && (
        <GradingPanel
          submission={active}
          onClose={() => setActive(null)}
          onGraded={() => {
            setActive(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function GradingPanel({
  submission,
  onClose,
  onGraded,
}: {
  submission: AdminSubmissionRow;
  onClose: () => void;
  onGraded: () => void;
}) {
  const max = submission.lesson?.assignment_max_points ?? null;
  const [grade, setGrade] = useState<string>(
    submission.grade?.toString() ?? "",
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!submission.file_url) return;
    fetch("/api/assignments/file-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: submission.file_url }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFileUrl(j?.url ?? null))
      .catch(() => setFileUrl(null));
  }, [submission.file_url]);

  const save = async (status: "graded" | "needs_revision") => {
    setIsSaving(true);
    const res = await fetch(
      `/api/admin/assignments/submissions/${submission.id}/grade`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: grade === "" ? null : Number(grade),
          feedback: feedback || null,
          status,
        }),
      },
    );
    setIsSaving(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(j.error ?? "Could not save");
      return;
    }
    toast.success(
      status === "needs_revision" ? "Marked needs revision" : "Graded",
    );
    onGraded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold">
              {submission.lesson?.title ?? "Submission"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {submission.user?.full_name} ({submission.user?.email})
              {" · "}
              {submission.course?.title}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {submission.text_response && (
          <div className="mb-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Written response
            </Label>
            <div className="mt-1 rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {submission.text_response}
            </div>
          </div>
        )}

        {submission.file_url && (
          <div className="mb-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              File
            </Label>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {submission.file_name ?? "submission"}
                  </p>
                  {submission.file_size && (
                    <p className="text-xs text-muted-foreground">
                      {submission.file_size > 1024 * 1024
                        ? `${(submission.file_size / 1024 / 1024).toFixed(1)} MB`
                        : `${Math.round(submission.file_size / 1024)} KB`}
                    </p>
                  )}
                </div>
              </div>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[120px_1fr] mb-4">
          <div>
            <Label>Grade</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={max ?? undefined}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-24"
              />
              {max != null && (
                <span className="text-sm text-muted-foreground">/ {max}</span>
              )}
            </div>
            {max == null && (
              <p className="mt-1 text-xs text-muted-foreground">Ungraded — feedback only</p>
            )}
          </div>
          <div>
            <Label>Feedback</Label>
            <Textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={5000}
              placeholder="What went well, what could be improved…"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => save("needs_revision")}
          >
            Needs revision
          </Button>
          <Button disabled={isSaving} onClick={() => save("graded")}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
            Save grade
          </Button>
        </div>
      </div>
    </div>
  );
}
