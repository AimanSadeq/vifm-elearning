import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { applyRateLimit } from "@/lib/utils/rate-limit";

/**
 * Public, unauthenticated certificate verification.
 *
 * Rate-limited to stop brute-force enumeration of `verification_code`s, and
 * column-restricted to avoid leaking internal certificate columns
 * (revoke_reason, raw metadata, internal pdf_url, etc.) to anyone with a
 * valid code.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = await applyRateLimit(request, {
      scope: "cert:verify",
      buckets: [
        { limit: 30, windowMs: 60_000 },
        { limit: 200, windowMs: 60 * 60_000 },
      ],
    });
    if (limited) return limited;

    const code = request.nextUrl.searchParams.get("code");
    if (!code || code.length > 128) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select(
        "certificate_number, status, issued_at, " +
          "course:courses(title, title_ar), " +
          "user:profiles!certificates_user_id_fkey(full_name)"
      )
      .eq("verification_code", code)
      .maybeSingle();

    // Collapse "not found" and "any internal error" into the same response
    // so we never leak whether a code exists.
    if (error || !data) {
      return NextResponse.json({ data: { valid: false } }, { status: 200 });
    }

    const cert = data as unknown as {
      certificate_number: string;
      status: string;
      issued_at: string;
      course: { title: string | null; title_ar: string | null } | null;
      user: { full_name: string | null } | null;
    };

    // Don't leak the holder's name on a revoked cert.
    const isIssued = cert.status === "issued";

    return NextResponse.json({
      data: {
        valid: isIssued,
        certificate: {
          certificateNumber: cert.certificate_number,
          status: cert.status,
          issuedAt: cert.issued_at,
          userName: isIssued ? cert.user?.full_name ?? null : null,
          courseName: cert.course?.title ?? null,
          courseNameAr: cert.course?.title_ar ?? null,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
