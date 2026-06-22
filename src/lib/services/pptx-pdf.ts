// Converts a certificate .pptx (rendered from the admin template) to PDF via
// ConvertAPI (https://www.convertapi.com). Set CONVERTAPI_SECRET to enable.
// Kept behind a feature check so the certificates download gracefully falls
// back to the built-in renderer when no converter is configured.

export function isPdfConversionConfigured(): boolean {
  return Boolean(process.env.CONVERTAPI_SECRET);
}

export async function convertPptxToPdf(
  pptx: Buffer,
  filename = "certificate.pptx",
): Promise<Buffer> {
  const secret = process.env.CONVERTAPI_SECRET;
  if (!secret) {
    throw new Error("PDF conversion is not configured (CONVERTAPI_SECRET).");
  }

  const form = new FormData();
  // Return the converted file inline as base64 instead of hosting it.
  form.append("StoreFile", "false");
  form.append(
    "File",
    new Blob([new Uint8Array(pptx)], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
    filename,
  );

  const res = await fetch(
    `https://v2.convertapi.com/convert/pptx/to/pdf?Secret=${encodeURIComponent(secret)}`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ConvertAPI failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    Files?: Array<{ FileData?: string }>;
  };
  const data = json.Files?.[0]?.FileData;
  if (!data) throw new Error("ConvertAPI returned no file.");
  return Buffer.from(data, "base64");
}
