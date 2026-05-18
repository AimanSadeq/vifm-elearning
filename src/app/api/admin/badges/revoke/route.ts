import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { badgesClient, isBadgesEnabled } from "@/lib/services/badges-client";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isBadgesEnabled()) {
    return NextResponse.json(
      { error: "Badges integration is not configured." },
      { status: 503 }
    );
  }

  let body: { verificationId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.verificationId) {
    return NextResponse.json(
      { error: "verificationId is required" },
      { status: 400 }
    );
  }

  const result = await badgesClient.revokeBadge(
    body.verificationId,
    body.reason
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to revoke" },
      { status: result.status ?? 502 }
    );
  }

  return NextResponse.json({ success: true });
}
