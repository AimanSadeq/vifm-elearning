import { NextRequest, NextResponse } from "next/server";
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

const ALLOWED_TIERS = [
  "course",
  "specialization",
  "certification",
  "distinction",
] as const;

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!isBadgesEnabled()) {
    return NextResponse.json(
      { error: "Badges integration is not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    tier?: string;
    category?: string;
    criteria?: string;
    description?: string;
    skills?: string[];
    externalId?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const tier = body.tier as (typeof ALLOWED_TIERS)[number];
  if (!ALLOWED_TIERS.includes(tier)) {
    return NextResponse.json(
      {
        error: `tier must be one of: ${ALLOWED_TIERS.join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (!body.category?.trim()) {
    return NextResponse.json(
      { error: "category is required" },
      { status: 400 }
    );
  }
  if (!body.criteria?.trim()) {
    return NextResponse.json(
      { error: "criteria is required" },
      { status: 400 }
    );
  }

  const result = await badgesClient.createTemplate({
    name: body.name.trim(),
    tier,
    category: body.category.trim(),
    criteria: body.criteria.trim(),
    description: body.description?.trim(),
    skills: body.skills,
    externalId: body.externalId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to create template" },
      { status: result.status ?? 502 }
    );
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
