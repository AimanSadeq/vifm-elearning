import PizZip from "pizzip";

/** Tokens whose values are filled at generation time from learner / cert data. */
export const DYNAMIC_PLACEHOLDERS = new Set([
  "ATTENDEE_NAME",
  "COURSE_TITLE",
  // Both DATE and DATE_RANGE map to the issue / completion date — different
  // .pptx templates use different conventions, so we accept either.
  "DATE",
  "DATE_RANGE",
  "CODE",
]);

/**
 * Cap on the cumulative decompressed size of the slide XMLs we'll inspect.
 * A real .pptx with hundreds of slides clocks in well under 5 MB of text;
 * anything past this threshold is almost certainly a zip bomb (PizZip will
 * happily walk a 25 MB upload that decompresses to gigabytes otherwise).
 *
 * Note: regex is intentionally ASCII-only. The generator's substitution
 * uses the same character class; widening one without the other would make
 * tokens discoverable but unsubstitutable (or vice versa) — keep them in
 * sync.
 */
const MAX_DECOMPRESSED_BYTES = 5 * 1024 * 1024;
const TOKEN_REGEX = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

/**
 * Scans every text-bearing XML inside a .pptx and returns the unique set of
 * `{{TOKEN}}` tokens it contains. Used:
 *   - by the upload route, to surface placeholders to the admin UI
 *   - by the placeholders endpoint, to refresh that list on demand
 *
 * Throws if the cumulative decompressed slide XML exceeds the safety cap.
 */
export function discoverPlaceholders(pptxBuffer: Buffer): string[] {
  const zip = new PizZip(pptxBuffer);
  const seen = new Set<string>();
  let totalDecompressed = 0;
  for (const filename of Object.keys(zip.files)) {
    if (!filename.endsWith(".xml")) continue;
    if (
      !filename.includes("ppt/slides/") &&
      !filename.includes("ppt/slideLayouts/") &&
      !filename.includes("ppt/slideMasters/") &&
      !filename.includes("ppt/notesSlides/")
    ) {
      continue;
    }
    const xml = zip.files[filename].asText();
    totalDecompressed += xml.length;
    if (totalDecompressed > MAX_DECOMPRESSED_BYTES) {
      throw new Error(
        `[discover-placeholders] .pptx slides decompressed past ${MAX_DECOMPRESSED_BYTES} bytes refusing to scan further`
      );
    }
    let m: RegExpExecArray | null;
    while ((m = TOKEN_REGEX.exec(xml)) !== null) seen.add(m[1]);
  }
  return Array.from(seen).sort();
}
