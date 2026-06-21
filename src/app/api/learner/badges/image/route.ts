import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Streams a badge image from the badge service through our own origin with an
// attachment header, so the learner's "Download" button works reliably even
// when the badge host doesn't send CORS headers. Verification ids are public
// (they appear in verify URLs), so authenticated access is sufficient.
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vid = request.nextUrl.searchParams.get("vid");
  if (!vid) {
    return NextResponse.json({ error: "vid is required" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BADGES_PUBLIC_URL;
  if (!base) {
    return NextResponse.json({ error: "Badges not configured" }, { status: 503 });
  }

  const upstream = `${base.replace(/\/+$/, "")}/api/verify/${encodeURIComponent(
    vid,
  )}/image`;

  let res: Response;
  try {
    res = await fetch(upstream);
  } catch {
    return NextResponse.json({ error: "Badge service unreachable" }, { status: 502 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Badge image not found" }, { status: 404 });
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("svg")
    ? "svg"
    : contentType.includes("jpeg")
      ? "jpg"
      : "png";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="badge-${vid}.${ext}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
