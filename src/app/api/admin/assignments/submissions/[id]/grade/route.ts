import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { gradeSubmission } from "@/lib/services/assignment-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const grade =
    body.grade === null || body.grade === undefined
      ? null
      : Number(body.grade);
  const feedback =
    typeof body.feedback === "string" ? body.feedback.slice(0, 5000) : null;
  const status =
    body.status === "needs_revision" ? "needs_revision" : "graded";

  if (grade !== null && (!Number.isFinite(grade) || grade < 0)) {
    return NextResponse.json(
      { error: "Grade must be a non-negative number or null" },
      { status: 400 }
    );
  }

  const result = await gradeSubmission({
    submissionId: id,
    graderId: guard.user.id,
    grade,
    feedback,
    status,
  });

  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ data: result.data });
}
