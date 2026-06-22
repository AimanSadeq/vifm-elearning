"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/StarRating";

interface Props {
  courseId: string;
  courseTitle?: string | null;
  locale: string;
  onClose: () => void;
}

/**
 * Celebration shown when a learner finishes a course: links to their
 * certificate and lets them rate the course (1-5 + optional review).
 */
export function CourseCompleteModal({
  courseId,
  courseTitle,
  locale,
  onClose,
}: Props) {
  const ar = locale === "ar";
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRating() {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      setError(ar ? "تعذّر حفظ التقييم." : "Could not save your rating.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
              <Award className="h-5 w-5" />
            </span>
            {ar ? "أحسنت! لقد أكملت الدورة" : "Congratulations — course complete!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {ar
              ? `لقد أكملت ${courseTitle ?? "الدورة"}. شهادتك متاحة في صفحة "شهاداتي".`
              : `You've completed ${courseTitle ?? "the course"}. Your certificate is ready on the My Certificates page.`}
          </p>

          <Link href={`/${locale}/certificates`} onClick={onClose}>
            <Button className="w-full">
              <Award className="h-4 w-4 me-2" />
              {ar ? "عرض الشهادة" : "View Certificate"}
            </Button>
          </Link>

          {/* Rating */}
          <div className="rounded-lg border p-4">
            {submitted ? (
              <p className="text-center text-sm font-medium text-success">
                {ar ? "شكراً لتقييمك!" : "Thanks for your rating!"}
              </p>
            ) : (
              <>
                <p className="text-center text-sm font-semibold">
                  {ar ? "قيّم هذه الدورة" : "Rate this course"}
                </p>
                <div className="mt-2 flex justify-center">
                  <StarRating
                    rating={rating}
                    interactive
                    size="md"
                    onChange={setRating}
                  />
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder={
                    ar
                      ? "أخبرنا برأيك (اختياري)"
                      : "Tell us what you thought (optional)"
                  }
                  className="mt-3 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                {error && <p className="mt-2 text-xs text-error">{error}</p>}
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  disabled={rating < 1 || submitting}
                  onClick={submitRating}
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  )}
                  {ar ? "إرسال التقييم" : "Submit rating"}
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {ar ? "لاحقاً" : "Maybe later"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
