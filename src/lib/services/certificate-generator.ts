import PizZip from "pizzip";
import { DYNAMIC_PLACEHOLDERS } from "@/lib/cert-layout/discover-placeholders";
import { loadActiveTemplate } from "@/lib/cert-layout/load-template";
import type { CertificateTemplateKey } from "@/types";

interface CertificateData {
  userName: string;
  courseName: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string;
}

// Kept for compatibility with the existing API surface; the visual design
// now lives inside the .pptx file, so most fields are unused.
export interface TemplateConfig {
  templateKey: CertificateTemplateKey;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  organizationName: string;
  /** Optional Storage path of an admin-uploaded .pptx — overrides bundled. */
  pptxPath?: string | null;
  /**
   * Static `{{TOKEN}}` substitutions chosen by the admin (e.g.
   * `{ CITY: "Riyadh", INSTRUCTOR_NAME: "Dr Smith" }`). Merged with the
   * dynamic per-cert values below; any leftover placeholders in the .pptx
   * are blanked out so learners never see a literal `{{X}}`.
   */
  placeholderValues?: Record<string, string> | null;
}

function escapeXml(value: string): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isReplaceableXml(filename: string): boolean {
  // We only touch the parts of the .pptx where text lives. Skipping
  // _rels / theme / etc keeps us safe from accidentally rewriting refs.
  return (
    filename.endsWith(".xml") &&
    (filename.includes("ppt/slides/") ||
      filename.includes("ppt/slideLayouts/") ||
      filename.includes("ppt/slideMasters/") ||
      filename.includes("ppt/notesSlides/"))
  );
}

/**
 * Builds a personalized certificate as a .pptx Buffer. Returns the file
 * (along with the mime type and extension) so callers can store it as-is.
 * PDF conversion is intentionally out-of-scope — wire up CloudConvert / a
 * LibreOffice runner in a separate step if PDF output is needed.
 *
 * `config` is read for `organizationName` (mapped to `{{CLIENT_NAME}}`) so
 * admins can override the institute label without re-uploading the .pptx.
 */
export async function generateCertificateFile(
  data: CertificateData,
  config?: TemplateConfig
): Promise<{ buffer: Buffer; mimeType: string; extension: "pptx" }> {
  const templateBuffer = await loadActiveTemplate(config?.pptxPath);
  const zip = new PizZip(templateBuffer);

  const formattedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const clientName = config?.organizationName?.trim() || "VIFM Academy";

  // Merged value map: static admin-set values first (so dynamic ones
  // override), then dynamic per-cert values. Any token in the .pptx that's
  // not in this map gets blanked out — preferable to shipping a literal
  // `{{X}}` to the learner. Only the well-known dynamic tokens are *required*
  // to be present; everything else is optional / admin-controlled.
  const values: Record<string, string> = {
    ...(config?.placeholderValues ?? {}),
    ATTENDEE_NAME: data.userName,
    COURSE_TITLE: data.courseName,
    DATE: formattedDate,
    DATE_RANGE: formattedDate,
    CODE: data.certificateNumber,
    CLIENT_NAME: clientName,
    VERIFICATION_URL: data.verificationUrl,
  };

  // Track tokens we encountered + tokens still unresolved post-substitution
  // (latter only happens if PowerPoint split a token across XML runs).
  const tokensSeen = new Set<string>();
  const stillUnresolved = new Set<string>();
  const tokenRegex = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

  for (const filename of Object.keys(zip.files)) {
    if (!isReplaceableXml(filename)) continue;
    const original = zip.files[filename].asText();
    const updated = original.replace(tokenRegex, (_, name: string) => {
      tokensSeen.add(name);
      // Unknown placeholder → blank string (not the literal {{X}} text).
      const raw = name in values ? values[name] : "";
      return escapeXml(raw);
    });
    if (updated !== original) zip.file(filename, updated);

    // Re-scan the updated XML for any leftover {{X}} (split-tag cases).
    let m: RegExpExecArray | null;
    while ((m = tokenRegex.exec(updated)) !== null) {
      stillUnresolved.add(m[0]);
    }
  }

  // Only fail loudly when one of the *required dynamic* tokens is still
  // unresolved — that means the admin's .pptx has a split-tag the regex
  // couldn't reach AND the field is something learners need (their name,
  // course, etc). Custom static placeholders that the admin forgot to set
  // are merely blank, which is recoverable.
  const blockingMissing = Array.from(stillUnresolved).filter((tok) => {
    const name = tok.replace(/[{}]/g, "");
    return DYNAMIC_PLACEHOLDERS.has(name);
  });
  if (blockingMissing.length > 0) {
    throw new Error(
      `[certificate-generator] required placeholders unresolved: ${blockingMissing.join(", ")}. ` +
        `PowerPoint may have split the token across runs open the .pptx, delete and retype the affected text, and re-upload.`
    );
  }

  const pptxBuffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return {
    buffer: pptxBuffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: "pptx",
  };
}

/**
 * Backwards-compatible wrapper for older callers that expect a Buffer of the
 * final file. Returns the .pptx Buffer (no longer a PDF).
 */
export async function generateCertificatePdf(
  data: CertificateData,
  config?: TemplateConfig
): Promise<Buffer> {
  const { buffer } = await generateCertificateFile(data, config);
  return buffer;
}
