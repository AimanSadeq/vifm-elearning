import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Resolves and streams a badge image through our own origin.
//   ?vid=<verification_id>          -> inline image (for <img>)
//   ?vid=<verification_id>&download=1 -> attachment (for the Download button)
// The badge service doesn't return an image_url in the list API, so we resolve
// it from the public verify page's og:image (badges are built for social
// sharing, so that tag is always present), with a couple of fallbacks.
// Serving it same-origin also means downloads work regardless of the badge
// host's CORS policy.
export const runtime = "nodejs";

async function resolveImageUrl(
  base: string,
  vid: string,
): Promise<string | null> {
  const clean = base.replace(/\/+$/, "");
  const abs = (u: string) =>
    u.startsWith("http") ? u : `${clean}${u.startsWith("/") ? "" : "/"}${u}`;

  // Preferred: the verify page's og:image / twitter:image.
  try {
    const pageRes = await fetch(`${clean}/verify/${encodeURIComponent(vid)}`, {
      headers: { Accept: "text/html" },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const m =
        html.match(
          /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i,
        );
      if (m?.[1]) return abs(m[1]);
    }
  } catch {
    /* fall through to direct paths */
  }

  // Fallbacks: common direct image endpoints.
  return `${clean}/api/verify/${encodeURIComponent(vid)}/image`;
}

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

  const imageUrl = await resolveImageUrl(base, vid);
  if (!imageUrl) {
    return NextResponse.json({ error: "Badge image not found" }, { status: 404 });
  }

  let res: Response;
  try {
    res = await fetch(imageUrl);
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

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=600",
  };
  if (request.nextUrl.searchParams.get("download") === "1") {
    headers["Content-Disposition"] = `attachment; filename="badge-${vid}.${ext}"`;
  }

  return new NextResponse(body, { headers });
}
