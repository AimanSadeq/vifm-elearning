import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { badgesClient, isBadgesEnabled } from "@/lib/services/badges-client";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isBadgesEnabled()) {
    return NextResponse.json({
      data: [],
      enabled: false,
      error:
        "Badges integration is not configured. Set BADGES_API_BASE_URL and BADGES_API_KEY.",
    });
  }

  const result = await badgesClient.listTemplates();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to load templates" },
      { status: result.status ?? 502 }
    );
  }

  return NextResponse.json({
    data: result.data?.data ?? [],
    enabled: true,
  });
}
