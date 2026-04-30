import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/services/require-super-admin";
import { certLayoutSchema } from "@/lib/cert-layout/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Cap incoming body so a runaway client can't write 50 MB of JSON to one row. */
const MAX_BODY_BYTES = 200 * 1024;

const placeholderValuesSchema = z
  .record(z.string().max(80).regex(/^[A-Z][A-Z0-9_]*$/), z.string().max(500))
  .refine((v) => Object.keys(v).length <= 100, {
    message: "Too many placeholders (max 100)",
  });

const patchSchema = z.object({
  layout: certLayoutSchema.optional(),
  placeholderValues: placeholderValuesSchema.optional(),
});

/**
 * PATCH /api/admin/certificate-templates/:id
 *
 * Body (any subset):
 *   { layout?: CertLayout, placeholderValues?: Record<TOKEN, string> }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Body too large (max ${MAX_BODY_BYTES} bytes)` },
      { status: 413 }
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json(
      { error: "Body is not valid JSON" },
      { status: 400 }
    );
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.layout !== undefined) update.layout = parsed.data.layout;
  if (parsed.data.placeholderValues !== undefined)
    update.placeholder_values = parsed.data.placeholderValues;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("certificate_templates")
    .update(update)
    .eq("id", id);
  if (error) {
    console.error("certificate template update failed", error);
    return NextResponse.json(
      { error: "Could not update template" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
