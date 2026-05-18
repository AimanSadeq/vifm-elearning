"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  CourseSurvey,
  SurveyAnswers,
  SurveyAnswerValue,
  SurveyQuestion,
  SurveyResponse,
} from "@/types/survey";

interface Props {
  courseId: string;
  /** When false, the modal can be dismissed without submitting. */
  required: boolean;
  /**
   * Called after a successful submit. Parent should re-fetch
   * cert/badge availability — it just unblocked.
   */
  onSubmitted: () => void;
  onClose: () => void;
}

export function CourseSurveyModal({
  courseId,
  required,
  onSubmitted,
  onClose,
}: Props) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [survey, setSurvey] = useState<CourseSurvey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/courses/${courseId}/survey`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const payload = j.data as {
          survey: CourseSurvey;
          questions: SurveyQuestion[];
          existingResponse: SurveyResponse | null;
        } | null;
        if (!payload) {
          // No active survey — close immediately
          onClose();
          return;
        }
        setSurvey(payload.survey);
        setQuestions(payload.questions);
        setAnswers(payload.existingResponse?.answers ?? {});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const setAnswer = (qid: string, value: SurveyAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const submit = async () => {
    setIsSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/survey/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setIsSubmitting(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(j.error ?? "Could not submit");
      return;
    }
    toast.success("Thanks for your feedback!");
    onSubmitted();
  };

  const title =
    (isAr ? survey?.title_ar : survey?.title) ??
    survey?.title ??
    "Course Feedback";
  const description =
    (isAr ? survey?.description_ar : survey?.description) ??
    survey?.description ??
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        {!required && (
          <button
            onClick={onClose}
            className="absolute top-4 end-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold">{title}</h2>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
              {required && (
                <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  Your certificate and badge will be unlocked after you submit
                  this survey.
                </p>
              )}
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <QuestionRenderer
                  key={q.id}
                  q={q}
                  index={idx}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                  isAr={isAr}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-2 border-t border-border pt-4">
              {!required && (
                <Button variant="outline" onClick={onClose}>
                  Skip
                </Button>
              )}
              <Button onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : null}
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionRenderer({
  q,
  index,
  value,
  onChange,
  isAr,
}: {
  q: SurveyQuestion;
  index: number;
  value: SurveyAnswerValue | undefined;
  onChange: (v: SurveyAnswerValue) => void;
  isAr: boolean;
}) {
  const text = (isAr ? q.question_text_ar : q.question_text) ?? q.question_text;

  return (
    <div>
      <p className="mb-3 text-sm font-medium">
        Q{index + 1}. {text}
        {q.is_required && <span className="text-error ms-1">*</span>}
      </p>

      {q.question_type === "rating" && (
        <StarRating
          value={typeof value === "number" ? value : 0}
          onChange={onChange}
        />
      )}

      {q.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {(q.options?.choices ?? []).map((c, i) => {
            const label = (isAr ? c.label_ar : c.label) ?? c.label;
            const checked = value === c.label;
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={checked}
                  onChange={() => onChange(c.label)}
                  className="h-4 w-4"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.question_type === "free_text" && (
        <Textarea
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5000}
          placeholder={isAr ? "اكتب إجابتك..." : "Type your answer..."}
        />
      )}

      {q.question_type === "nps" && (
        <NpsRenderer
          value={
            value && typeof value === "object"
              ? (value as { score: number; reason?: string })
              : { score: -1, reason: "" }
          }
          followUp={
            (isAr ? q.options?.follow_up_text_ar : q.options?.follow_up_text) ??
            q.options?.follow_up_text ??
            "Why?"
          }
          onChange={onChange}
        />
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-1 hover:bg-muted"
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              className={`h-8 w-8 ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function NpsRenderer({
  value,
  followUp,
  onChange,
}: {
  value: { score: number; reason?: string };
  followUp: string;
  onChange: (v: { score: number; reason?: string }) => void;
}) {
  const score = value.score;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }).map((_, i) => {
          const selected = score === i;
          // Colour cue: detractor red (0-6), passive amber (7-8), promoter green (9-10).
          const tone =
            i <= 6
              ? "border-red-500/40 hover:bg-red-500/10"
              : i <= 8
                ? "border-amber-500/40 hover:bg-amber-500/10"
                : "border-green-500/40 hover:bg-green-500/10";
          const selectedTone =
            i <= 6
              ? "bg-red-500 text-white border-red-500"
              : i <= 8
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-green-500 text-white border-green-500";
          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                onChange({ score: i, reason: value.reason ?? "" })
              }
              className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                selected ? selectedTone : tone
              }`}
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>

      {score >= 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {followUp}
          </label>
          <Textarea
            rows={2}
            value={value.reason ?? ""}
            onChange={(e) =>
              onChange({ score, reason: e.target.value })
            }
            maxLength={2000}
          />
        </div>
      )}
    </div>
  );
}
