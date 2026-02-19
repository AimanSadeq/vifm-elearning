import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code)
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );

    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select(
        "*, course:courses(title, title_ar), user:profiles!certificates_user_id_fkey(full_name)"
      )
      .eq("verification_code", code)
      .single();

    if (error || !data)
      return NextResponse.json(
        { data: { valid: false } },
        { status: 200 }
      );

    return NextResponse.json({
      data: {
        valid: data.status === "issued",
        certificate: {
          certificateNumber: data.certificate_number,
          status: data.status,
          issuedAt: data.issued_at,
          userName: data.user?.full_name,
          courseName: data.course?.title,
          courseNameAr: data.course?.title_ar,
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
