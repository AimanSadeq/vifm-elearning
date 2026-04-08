import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Nightly cron: Automated designation status transitions.
 *
 * Transitions:
 * 1. Active -> Grace Period  (when renewal deadline passes without renewal)
 * 2. Grace Period -> Suspended  (when grace period expires)
 * 3. Suspended -> Lapsed  (12 months after suspension)
 *
 * Email notifications are handled by Operations outside the portal.
 * Secured by CRON_SECRET header.
 * Schedule: Daily at 1:00 AM UTC via external cron.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const results = { toGrace: 0, toSuspended: 0, toLapsed: 0, errors: 0 };

  try {
    const { data: designations } = await supabase
      .from("designations")
      .select("id, abbreviation, renewal_month, renewal_day, grace_period_months")
      .eq("is_active", true);

    if (!designations) {
      return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
    }

    for (const desig of designations) {
      const renewalDate = new Date(now.getFullYear(), desig.renewal_month - 1, desig.renewal_day);

      // 1. Active -> Grace Period (renewal date has passed)
      if (now >= renewalDate) {
        const { data: activeHolders } = await supabase
          .from("designation_holders")
          .select("id")
          .eq("designation_id", desig.id)
          .eq("status", "active")
          .or(`current_period_end.is.null,current_period_end.lt.${renewalDate.toISOString()}`);

        for (const holder of activeHolders || []) {
          const { error } = await supabase
            .from("designation_holders")
            .update({ status: "grace_period", updated_at: now.toISOString() })
            .eq("id", holder.id);

          if (error) {
            results.errors++;
          } else {
            results.toGrace++;
          }
        }
      }

      // 2. Grace Period -> Suspended (grace period expired)
      const graceEndDate = new Date(now.getFullYear(), desig.renewal_month - 1 + desig.grace_period_months, desig.renewal_day);
      if (now >= graceEndDate) {
        const { data: graceHolders } = await supabase
          .from("designation_holders")
          .select("id")
          .eq("designation_id", desig.id)
          .eq("status", "grace_period");

        for (const holder of graceHolders || []) {
          const { error } = await supabase
            .from("designation_holders")
            .update({
              status: "suspended",
              updated_at: now.toISOString(),
              suspended_at: now.toISOString(),
            })
            .eq("id", holder.id);

          if (error) {
            results.errors++;
          } else {
            results.toSuspended++;
          }
        }
      }
    }

    // 3. Suspended -> Lapsed (12 months after suspension)
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: suspendedHolders } = await supabase
      .from("designation_holders")
      .select("id")
      .eq("status", "suspended")
      .lt("suspended_at", twelveMonthsAgo.toISOString());

    for (const holder of suspendedHolders || []) {
      const { error } = await supabase
        .from("designation_holders")
        .update({ status: "lapsed", updated_at: now.toISOString() })
        .eq("id", holder.id);

      if (error) {
        results.errors++;
      } else {
        results.toLapsed++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      transitions: results,
    });
  } catch (err) {
    console.error("Designation status cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
