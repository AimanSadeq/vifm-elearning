// Converts a certificate .pptx (rendered from the admin template) to PDF via
// CloudConvert (https://cloudconvert.com). Set CLOUDCONVERT_API_KEY to enable.
// Behind a feature check so the certificates download falls back to the
// built-in renderer when no converter is configured.

const API = "https://api.cloudconvert.com/v2";
const SYNC_API = "https://sync.api.cloudconvert.com/v2";

export function isPdfConversionConfigured(): boolean {
  return Boolean(process.env.CLOUDCONVERT_API_KEY);
}

interface CcTask {
  name: string;
  operation: string;
  status: string;
  result?: {
    form?: { url: string; parameters: Record<string, string> };
    files?: Array<{ filename: string; url: string }>;
  };
}

export async function convertPptxToPdf(
  pptx: Buffer,
  filename = "certificate.pptx",
): Promise<Buffer> {
  const key = process.env.CLOUDCONVERT_API_KEY;
  if (!key) {
    throw new Error("PDF conversion is not configured (CLOUDCONVERT_API_KEY).");
  }
  const auth = { Authorization: `Bearer ${key}` };

  // 1. Create a job: import/upload -> convert -> export/url.
  const jobRes = await fetch(`${API}/jobs`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: {
        upload: { operation: "import/upload" },
        convert: {
          operation: "convert",
          input: "upload",
          input_format: "pptx",
          output_format: "pdf",
        },
        export: { operation: "export/url", input: "convert" },
      },
    }),
  });
  if (!jobRes.ok) {
    const detail = await jobRes.text().catch(() => "");
    throw new Error(
      `CloudConvert job create failed (${jobRes.status}): ${detail.slice(0, 200)}`,
    );
  }
  const job = (await jobRes.json()) as {
    data: { id: string; tasks: CcTask[] };
  };
  const form = job.data.tasks.find((t) => t.name === "upload")?.result?.form;
  if (!form) throw new Error("CloudConvert: no upload form returned.");

  // 2. Upload the .pptx to the import form.
  const fd = new FormData();
  for (const [k, v] of Object.entries(form.parameters)) fd.append(k, v);
  fd.append("file", new Blob([new Uint8Array(pptx)]), filename);
  const upRes = await fetch(form.url, { method: "POST", body: fd });
  if (!upRes.ok) {
    throw new Error(`CloudConvert upload failed (${upRes.status}).`);
  }

  // 3. Wait for the job to finish (sync endpoint blocks until done / timeout).
  const waitRes = await fetch(`${SYNC_API}/jobs/${job.data.id}/wait`, {
    headers: auth,
  });
  if (!waitRes.ok) {
    throw new Error(`CloudConvert wait failed (${waitRes.status}).`);
  }
  const finished = (await waitRes.json()) as {
    data: { status: string; tasks: CcTask[] };
  };
  if (finished.data.status !== "finished") {
    throw new Error(
      `CloudConvert job did not finish (status=${finished.data.status}).`,
    );
  }

  const fileUrl = finished.data.tasks.find(
    (t) => t.operation === "export/url" && t.status === "finished",
  )?.result?.files?.[0]?.url;
  if (!fileUrl) throw new Error("CloudConvert: no export file URL.");

  // 4. Download the resulting PDF.
  const pdfRes = await fetch(fileUrl);
  if (!pdfRes.ok) {
    throw new Error(`CloudConvert download failed (${pdfRes.status}).`);
  }
  return Buffer.from(await pdfRes.arrayBuffer());
}
