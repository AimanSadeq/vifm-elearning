"use client";

import { useEffect, useState } from "react";
import { BookOpen, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  courseTitle: string;
}
interface CertRow {
  id: string;
  certificateNumber: string;
  status: string;
  issuedAt: string;
  courseTitle: string;
}
interface Detail {
  profile: { full_name: string | null; email: string | null } | null;
  enrollments: Enrollment[];
  certificates: CertRow[];
}

export function LearnerDetailModal({
  learnerId,
  learnerName,
  onClose,
}: {
  learnerId: string;
  learnerName: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/learners/${learnerId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setDetail(j.data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  const completed =
    detail?.enrollments.filter((e) => e.status === "completed").length ?? 0;

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.profile?.full_name || learnerName}</DialogTitle>
          {detail?.profile?.email && (
            <p className="text-sm text-muted-foreground">
              {detail.profile.email}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Courses */}
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-brand-600" />
                Courses ({detail?.enrollments.length ?? 0}) · {completed}{" "}
                completed
              </h3>
              {detail?.enrollments.length ? (
                <div className="divide-y rounded-lg border">
                  {detail.enrollments.map((e) => (
                    <div key={e.id} className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">
                          {e.courseTitle}
                        </span>
                        {e.status === "completed" ? (
                          <Badge variant="success">Completed</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {e.progress}%
                          </span>
                        )}
                      </div>
                      {e.status !== "completed" && (
                        <Progress value={e.progress} className="mt-1.5 h-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No enrollments.
                </p>
              )}
            </section>

            {/* Certificates */}
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Award className="h-4 w-4 text-brand-600" />
                Certificates ({detail?.certificates.length ?? 0})
              </h3>
              {detail?.certificates.length ? (
                <div className="divide-y rounded-lg border">
                  {detail.certificates.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.courseTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.certificateNumber} · {formatDate(c.issuedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          c.status === "issued" ? "success" : "destructive"
                        }
                      >
                        {c.status === "issued" ? "Valid" : c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No certificates yet.
                </p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
