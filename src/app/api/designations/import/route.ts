import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ImportRow {
  full_name: string;
  email: string;
  certified_at: string;
  phone?: string;
  company?: string;
  job_title?: string;
  country?: string;
  linkedin_url?: string;
  language?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — must be super_admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { rows, designationSlug = "cdip", tierSlug = "founding-member" } =
      await request.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get designation and tier
    const { data: designation } = await adminSupabase
      .from("designations")
      .select("id, abbreviation")
      .eq("slug", designationSlug)
      .single();

    if (!designation) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    const { data: tier } = await adminSupabase
      .from("designation_tiers")
      .select("id")
      .eq("designation_id", designation.id)
      .eq("slug", tierSlug)
      .single();

    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    const results = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [] as { row: number; email: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as ImportRow;

      if (!row.email || !row.full_name) {
        results.errors.push({
          row: i + 1,
          email: row.email || "missing",
          error: "Missing required fields: email, full_name",
        });
        results.skipped++;
        continue;
      }

      try {
        const email = row.email.trim().toLowerCase();

        // Check if profile already exists
        const { data: existingProfile } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        let userId: string;

        if (existingProfile) {
          userId = existingProfile.id;
        } else {
          // Create auth user via admin API
          const { data: authUser, error: authError } =
            await adminSupabase.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                full_name: row.full_name.trim(),
              },
            });

          if (authError) {
            // User might exist in auth but not in profiles
            if (authError.message.includes("already been registered")) {
              const { data: authLookup } =
                await adminSupabase.auth.admin.listUsers();
              const found = authLookup?.users?.find(
                (u) => u.email === email
              );
              if (found) {
                userId = found.id;
              } else {
                throw new Error(authError.message);
              }
            } else {
              throw new Error(authError.message);
            }
          } else {
            userId = authUser.user.id;
          }

          // Create profile if it doesn't exist
          const { data: profileCheck } = await adminSupabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .single();

          if (!profileCheck) {
            await adminSupabase.from("profiles").insert({
              id: userId,
              email,
              full_name: row.full_name.trim(),
              phone: row.phone?.trim() || null,
              job_title: row.job_title?.trim() || null,
              linkedin_url: row.linkedin_url?.trim() || null,
              language: row.language?.trim() || "en",
              role: "learner",
              is_active: true,
              email_verified: true,
            });
          }
        }

        // Check if already a holder for this designation
        const { data: existingHolder } = await adminSupabase
          .from("designation_holders")
          .select("id")
          .eq("user_id", userId)
          .eq("designation_id", designation.id)
          .single();

        if (existingHolder) {
          results.skipped++;
          continue;
        }

        // Generate member number
        const { data: memberNumResult } = await adminSupabase.rpc(
          "generate_member_number",
          { p_abbreviation: designation.abbreviation }
        );

        const memberNumber = memberNumResult || `${designation.abbreviation}-${new Date().getFullYear()}-${String(results.created + 1).padStart(4, "0")}`;

        // Calculate period
        const certifiedAt = row.certified_at
          ? new Date(row.certified_at).toISOString()
          : new Date().toISOString();

        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        // Insert holder
        await adminSupabase.from("designation_holders").insert({
          user_id: userId,
          designation_id: designation.id,
          tier_id: tier.id,
          status: "active",
          member_number: memberNumber,
          certified_at: certifiedAt,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cpe_hours_completed: 0,
          show_in_registry: true,
          registry_company: row.company?.trim() || null,
          registry_title: row.job_title?.trim() || null,
        });

        results.created++;
      } catch (err: unknown) {
        results.errors.push({
          row: i + 1,
          email: row.email,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: unknown) {
    console.error("Bulk import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
