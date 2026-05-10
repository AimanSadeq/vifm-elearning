import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Nightly cron: automated designation status transitions.
 *
 *   active        → grace_period   when renewal date passes without renewal
 *   grace_period  → suspended      when grace period expires
 *   suspended     → lapsed         12 months after suspension
 *
 * Uses set-based UPDATEs scoped by `designation_id` + status filter so the
 * route is O(designations × 2) DB calls regardless of how many holders
 * exist. Previously it was O(holders) — at 5k holders that meant 5k round
 * trips inside a single Render request, exceeding the 30s timeout.
 *
 * Auth: CRON_SECRET header. Schedule: daily at 1:00 AM UTC via external cron.
 */

function verifyCronSecret(header: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const results = { toGrace: 0, toSuspended: 0, toLapsed: 0, errors: 0 };

  try {
    const { data: designations, error: desigErr } = await supabaseAdmin
      .from("designations")
      .select("id, abbreviation, renewal_month, renewal_day, grace_period_months")
      .eq("is_active", true);

    if (desigErr || !designations) {
      return NextResponse.json(
        { error: "Failed to fetch designations" },
        { status: 500 }
      );
    }

    for (const desig of designations) {
      const renewalDate = new Date(
        now.getFullYear(),
        desig.renewal_month - 1,
        desig.renewal_day
      );

      // 1. Active → Grace Period — one UPDATE per designation regardless
      // of how many holders match.
      if (now >= renewalDate) {
        const { error: graceErr, count: graceCount } = await supabaseAdmin
          .from("designation_holders")
          .update(
            { status: "grace_period", updated_at: nowIso },
            { count: "exact" }
          )
          .eq("designation_id", desig.id)
          .eq("status", "active")
          .or(
            `current_period_end.is.null,current_period_end.lt.${renewalDate.toISOString()}`
          );

        if (graceErr) {
          console.error(
            `cron: active→grace failed for designation ${desig.abbreviation}`,
            graceErr
          );
          results.errors++;
        } else {
          results.toGrace += graceCount ?? 0;
        }
      }

      // 2. Grace Period → Suspended — likewise one UPDATE.
      const graceEndDate = new Date(
        now.getFullYear(),
        desig.renewal_month - 1 + desig.grace_period_months,
        desig.renewal_day
      );

      if (now >= graceEndDate) {
        const { error: suspendErr, count: suspendCount } = await supabaseAdmin
          .from("designation_holders")
          .update(
            {
              status: "suspended",
              updated_at: nowIso,
              suspended_at: nowIso,
            },
            { count: "exact" }
          )
          .eq("designation_id", desig.id)
          .eq("status", "grace_period");

        if (suspendErr) {
          console.error(
            `cron: grace→suspended failed for designation ${desig.abbreviation}`,
            suspendErr
          );
          results.errors++;
        } else {
          results.toSuspended += suspendCount ?? 0;
        }
      }
    }

    // 3. Suspended → Lapsed — single UPDATE across all designations.
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { error: lapseErr, count: lapseCount } = await supabaseAdmin
      .from("designation_holders")
      .update({ status: "lapsed", updated_at: nowIso }, { count: "exact" })
      .eq("status", "suspended")
      .lt("suspended_at", twelveMonthsAgo.toISOString());

    if (lapseErr) {
      console.error("cron: suspended→lapsed failed", lapseErr);
      results.errors++;
    } else {
      results.toLapsed += lapseCount ?? 0;
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      transitions: results,
    });
  } catch (err) {
    console.error("Designation status cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
