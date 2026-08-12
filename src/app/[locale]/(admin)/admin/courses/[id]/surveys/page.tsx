"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyBuilder } from "@/components/admin/SurveyBuilder";

export default function AdminCourseSurveyPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale();
  const [kind, setKind] = useState<"completion" | "followup" | "impact">(
    "completion",
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/admin/courses/${courseId}/edit`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {kind === "completion"
              ? "Course Survey"
              : kind === "followup"
                ? "90-Day Follow-Up Survey"
                : "6-Month Impact Survey"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {kind === "completion"
              ? "Shown to learners after they complete the course. When marked required, blocks the certificate and badge until submitted."
              : kind === "followup"
                ? "Sent to learners about 90 days after they complete assigned training, to measure how they applied it at work (Kirkpatrick Level 3)."
                : "Sent to learners about 180 days after they complete assigned training, to measure business results the training produced (Kirkpatrick Level 4)."}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border p-1">
          {(
            [
              ["completion", "Completion"],
              ["followup", "Follow-Up"],
              ["impact", "Impact"],
            ] as const
          ).map(([k, label]) => (
            <Button
              key={k}
              variant={kind === k ? "default" : "ghost"}
              size="sm"
              onClick={() => setKind(k)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <SurveyBuilder courseId={courseId} kind={kind} />
    </div>
  );
}
