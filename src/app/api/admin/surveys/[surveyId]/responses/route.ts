import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { aggregateResponses } from "@/lib/services/survey-service";

interface RouteParams {
  params: Promise<{ surveyId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { surveyId } = await params;
  const wantAggregate = request.nextUrl.searchParams.get("aggregate") === "1";

  if (wantAggregate) {
    const { questions, aggregates } = await aggregateResponses(surveyId);
    return NextResponse.json({ questions, aggregates });
  }

  const { data, error } = await supabaseAdmin
    .from("survey_responses")
    .select(
      "id, user_id, enrollment_id, answers, edit_count, submitted_at, updated_at, user:profiles!survey_responses_user_id_fkey(full_name, email)"
    )
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
