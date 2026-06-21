import { readFileSync } from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Path-allowlist for `pptx_path`. Anything else is rejected so a tampered or
 * legacy DB row can't trick us into downloading another tenant's certificate
 * (e.g. `<userId>/<certId>.pptx` from the issued-cert namespace) and serving
 * it as a "template". Both the runtime generator and the discovery endpoint
 * validate against this — keep them in sync by routing through here.
 */
export const TEMPLATE_PATH_PATTERN = /^templates\/[a-f0-9-]{8,}\.pptx$/i;

const BUNDLED_TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/lib/services/templates/vifm-classic.pptx"
);

let cachedBundled: Buffer | null = null;
function loadBundled(): Buffer {
  if (!cachedBundled) cachedBundled = readFileSync(BUNDLED_TEMPLATE_PATH);
  return cachedBundled;
}

export function isValidTemplatePath(p: string | null | undefined): p is string {
  return typeof p === "string" && TEMPLATE_PATH_PATTERN.test(p);
}

/**
 * Loads the active .pptx for a certificate template:
 *   - if `pptxPath` is set and matches the allowlist, downloads from the
 *     `certificates` Supabase Storage bucket;
 *   - otherwise returns the bundled `vifm-classic.pptx`.
 *
 * Throws when an explicit path is supplied but invalid or unreachable. We
 * deliberately do **not** silently fall back when an admin has chosen an
 * uploaded design — surfacing the error keeps issued certificates honest.
 */
export async function loadActiveTemplate(
  pptxPath?: string | null
): Promise<Buffer> {
  if (!pptxPath) return loadBundled();

  if (!isValidTemplatePath(pptxPath)) {
    throw new Error(
      `[cert-layout] refusing to load pptx_path "${pptxPath}" must match templates/<id>.pptx`
    );
  }

  const { data, error } = await supabaseAdmin.storage
    .from("certificates")
    .download(pptxPath);
  if (error || !data) {
    throw new Error(
      `[cert-layout] could not fetch template at "${pptxPath}": ${error?.message ?? "missing"}`
    );
  }
  return Buffer.from(await data.arrayBuffer());
}
