"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, FileText, ExternalLink, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface CpeSubmission {
  id: string;
  title: string;
  description: string | null;
  hours_claimed: number;
  hours_approved: number | null;
  status: "pending" | "approved" | "rejected";
  activity_date: string;
  provider: string | null;
  evidence_url: string | null;
  reviewer_notes: string | null;
  created_at: string;
  cpe_categories: { name: string; name_ar: string | null } | null;
  designation_holders: {
    member_number: string;
    designations: { abbreviation: string; name: string } | null;
  } | null;
  profile: { full_name: string; email: string } | null;
}

const STATUS_FILTERS = [
  { value: "pending", label: "Pending Review" },
  { value: "all", label: "All Submissions" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminCpeReviewPage() {
  const [submissions, setSubmissions] = useState<CpeSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewHours, setReviewHours] = useState<number | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  async function fetchSubmissions() {
    setIsLoading(true);
    const res = await fetch(`/api/admin/cpe-submissions?status=${statusFilter}`);
    const { data } = await res.json();
    setSubmissions(data ?? []);
    setIsLoading(false);
  }

  async function handleReview(id: string, status: "approved" | "rejected") {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    try {
      const res = await fetch(`/api/admin/cpe-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewer_notes: reviewNotes || undefined,
          hours_approved: status === "approved" ? (reviewHours ?? submission.hours_claimed) : 0,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      toast.success(status === "approved" ? "CPE submission approved" : "CPE submission rejected");
      setReviewingId(null);
      setReviewNotes("");
      setReviewHours(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update submission");
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CPE Review</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve CPE submissions from designation holders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-brand-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{s.profile?.full_name || "Unknown"}</span>
                      <span>|</span>
                      <span>{s.designation_holders?.member_number}</span>
                      <span>|</span>
                      <span>{s.cpe_categories?.name || "Uncategorized"}</span>
                      <span>|</span>
                      <span>{new Date(s.activity_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{s.hours_claimed} hr{s.hours_claimed !== 1 ? "s" : ""}</span>
                    {statusBadge(s.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {s.description && (
                  <p className="mb-3 text-sm text-muted-foreground">{s.description}</p>
                )}
                {s.provider && (
                  <p className="mb-3 text-xs text-muted-foreground">Provider: {s.provider}</p>
                )}

                {s.evidence_url && (
                  <a
                    href={s.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View Evidence
                  </a>
                )}

                {s.reviewer_notes && (
                  <div className="mb-3 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                    <strong>Reviewer notes:</strong> {s.reviewer_notes}
                  </div>
                )}

                {s.status === "pending" && (
                  <>
                    {reviewingId === s.id ? (
                      <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-4">
                          <label className="text-xs font-medium">
                            Hours to approve:
                            <input
                              type="number"
                              min={0}
                              max={s.hours_claimed}
                              step={0.5}
                              value={reviewHours ?? s.hours_claimed}
                              onChange={(e) => setReviewHours(Number(e.target.value))}
                              className="ml-2 w-20 rounded border px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                        <textarea
                          placeholder="Reviewer notes (optional for approval, required for rejection)"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={2}
                          className="w-full rounded border px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(s.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (!reviewNotes.trim()) {
                                toast.error("Rejection reason is required");
                                return;
                              }
                              handleReview(s.id, "rejected");
                            }}
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingId(null);
                              setReviewNotes("");
                              setReviewHours(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewingId(s.id)}
                        >
                          Review Submission
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
