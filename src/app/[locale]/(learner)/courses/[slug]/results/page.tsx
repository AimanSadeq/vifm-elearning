"use client";

import { useParams } from "next/navigation";
import { KnowledgeCheckSummary } from "@/components/quizzes/KnowledgeCheckSummary";

/**
 * End-of-course knowledge check results. Consolidates every check the learner
 * performed during the course and shows whether the certificate requirement
 * is met.
 */
export default function CourseResultsPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <KnowledgeCheckSummary courseRef={slug} />
    </div>
  );
}
