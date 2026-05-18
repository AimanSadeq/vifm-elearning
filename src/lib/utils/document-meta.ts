/**
 * Derive the actual file extension / kind label for a lesson document.
 * The DB's `content_type` is just "document" (vs video/quiz/...) and the
 * older `document_type` is sometimes set to "word"/"excel"/"pdf"/"zip"
 * — neither tells us the real extension on its own. The truth is in
 * the URL.
 *
 * Returns:
 *   - kind:  coarse bucket used to pick a viewer (pdf | excel | word |
 *            powerpoint | image | zip | other)
 *   - label: short uppercase label for badges (PDF | XLSX | DOCX | ...)
 *   - ext:   normalised lowercase extension ("" when unknown)
 */
export type DocumentKind =
  | "pdf"
  | "excel"
  | "word"
  | "powerpoint"
  | "image"
  | "zip"
  | "other";

export interface DocumentMeta {
  kind: DocumentKind;
  label: string;
  ext: string;
}

const EXT_TO_KIND: Record<string, DocumentKind> = {
  pdf: "pdf",
  xls: "excel",
  xlsx: "excel",
  csv: "excel",
  doc: "word",
  docx: "word",
  rtf: "word",
  ppt: "powerpoint",
  pptx: "powerpoint",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  zip: "zip",
  rar: "zip",
  "7z": "zip",
  tar: "zip",
  gz: "zip",
};

// When `document_type` is set but the URL has no usable extension,
// fall back to these mappings — older legacy data uses these words.
const LEGACY_TYPE_TO_EXT: Record<string, string> = {
  pdf: "pdf",
  word: "docx",
  excel: "xlsx",
  powerpoint: "pptx",
  ppt: "pptx",
  zip: "zip",
  image: "png",
};

export function getDocumentMeta(
  url: string | null | undefined,
  documentType: string | null | undefined,
): DocumentMeta {
  const cleanUrl = (url ?? "").split("?")[0].split("#")[0];
  const fromUrl = cleanUrl.split(".").pop()?.toLowerCase() ?? "";
  const fromType = (documentType ?? "").toLowerCase();

  // Prefer URL extension when it's a recognised one; otherwise try the
  // legacy document_type mapping.
  let ext = "";
  if (fromUrl && EXT_TO_KIND[fromUrl]) {
    ext = fromUrl;
  } else if (fromType && LEGACY_TYPE_TO_EXT[fromType]) {
    ext = LEGACY_TYPE_TO_EXT[fromType];
  } else if (fromUrl && fromUrl.length <= 5) {
    // Unknown but plausible extension (e.g. "key" for Keynote)
    ext = fromUrl;
  }

  const kind = EXT_TO_KIND[ext] ?? "other";
  const label = ext ? ext.toUpperCase() : "FILE";
  return { kind, label, ext };
}

export function isOfficeKind(kind: DocumentKind): boolean {
  return kind === "excel" || kind === "word" || kind === "powerpoint";
}
