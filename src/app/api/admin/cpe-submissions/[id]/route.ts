import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase as createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/cpe-submissions/[id]
 * Approve or reject a CPE submission.
 * Email notifications are handled by Operations outside the portal.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { status, reviewer_notes, hours_approved } = body as {
    status: "approved" | "rejected";
    reviewer_notes?: string;
    hours_approved?: number;
  };

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch the submission with holder info
  const { data: submission, error: fetchErr } = await supabase
    .from("cpe_submissions")
    .select(`
      *,
      designation_holders!inner (
        id, cpe_hours_completed
      )
    `)
    .eq("id", id)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const holder = submission.designation_holders as Record<string, unknown>;
  const approvedHours = status === "approved" ? (hours_approved ?? submission.hours_claimed) : 0;

  // Update submission
  const { error: updateErr } = await supabase
    .from("cpe_submissions")
    .update({
      status,
      hours_approved: approvedHours,
      reviewer_notes: reviewer_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Update holder CPE total if approved
  if (status === "approved") {
    const newTotal = ((holder.cpe_hours_completed as number) || 0) + approvedHours;
    await supabase
      .from("designation_holders")
      .update({ cpe_hours_completed: newTotal })
      .eq("id", holder.id);
  }

  return NextResponse.json({ success: true, status, hours_approved: approvedHours });
}
