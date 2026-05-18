import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { badgesClient, isBadgesEnabled } from "@/lib/services/badges-client";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isBadgesEnabled()) {
    return NextResponse.json({ data: [], enabled: false });
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(params.get("pageSize") ?? "25") || 25)
  );
  const status = params.get("status") ?? undefined;

  const result = await badgesClient.listBadges({ page, pageSize, status });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to load issued badges" },
      { status: result.status ?? 502 }
    );
  }

  return NextResponse.json({
    data: result.data?.data ?? [],
    total: result.data?.total ?? 0,
    enabled: true,
  });
}
