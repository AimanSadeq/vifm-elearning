// Client-side certificate renderer. Draws the certificate once onto a canvas,
// then exports it as PNG (native canvas) or PDF (jsPDF embeds the canvas image)
// — both formats share one design and need no extra/native dependencies.
// jspdf + qrcode are dynamically imported so they stay out of the page bundle
// until the learner actually downloads.

export interface CertRenderData {
  learnerName: string;
  courseName: string;
  certificateNumber: string;
  issuedAt: string; // ISO date
  verifyUrl: string;
}

// A4 landscape ratio (297:210). High-res for crisp print output.
const W = 2480;
const H = 1754;

const GOLD = "#c8aa64";
const NAVY = "#1a1a2e";
const LIGHT = "#b4b4c8";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCertificate(
  data: CertRenderData,
): Promise<HTMLCanvasElement> {
  const QRCode = (await import("qrcode")).default;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  // Background + decorative borders.
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.strokeRect(80, 80, W - 160, H - 160);
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 110, W - 220, H - 220);

  ctx.textAlign = "center";
  const cx = W / 2;

  ctx.fillStyle = GOLD;
  ctx.font = "bold 40px Helvetica, Arial, sans-serif";
  ctx.fillText("VIRGINIA INSTITUTE OF FINANCE AND MANAGEMENT", cx, 250);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 300, 290);
  ctx.lineTo(cx + 300, 290);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 84px Georgia, 'Times New Roman', serif";
  ctx.fillText("Certificate of Completion", cx, 440);

  ctx.fillStyle = LIGHT;
  ctx.font = "36px Helvetica, Arial, sans-serif";
  ctx.fillText("This is to certify that", cx, 580);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 96px Georgia, 'Times New Roman', serif";
  ctx.fillText(data.learnerName || "—", cx, 700);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 350, 740);
  ctx.lineTo(cx + 350, 740);
  ctx.stroke();

  ctx.fillStyle = LIGHT;
  ctx.font = "36px Helvetica, Arial, sans-serif";
  ctx.fillText("has successfully completed the course", cx, 840);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px Helvetica, Arial, sans-serif";
  const lines = wrapText(ctx, data.courseName, W - 700);
  let y = lines.length > 1 ? 930 : 950;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += 80;
  }

  // Details row.
  const detailsY = Math.max(y + 70, 1290);
  const date = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  ctx.fillStyle = LIGHT;
  ctx.font = "28px Helvetica, Arial, sans-serif";
  ctx.fillText("Date of Issue", cx - 520, detailsY);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Helvetica, Arial, sans-serif";
  ctx.fillText(date, cx - 520, detailsY + 50);

  ctx.fillStyle = LIGHT;
  ctx.font = "28px Helvetica, Arial, sans-serif";
  ctx.fillText("Certificate No.", cx + 520, detailsY);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px 'Courier New', monospace";
  ctx.fillText(data.certificateNumber, cx + 520, detailsY + 50);

  // QR code (centered) — optional; skip silently if it can't be generated.
  try {
    const qr = await QRCode.toDataURL(data.verifyUrl, {
      width: 260,
      margin: 1,
      color: { dark: NAVY, light: "#ffffff" },
    });
    const img = await loadImage(qr);
    const qrSize = 200;
    // white plate so the QR stays scannable on the navy background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - qrSize / 2 - 10, detailsY + 100 - 10, qrSize + 20, qrSize + 20);
    ctx.drawImage(img, cx - qrSize / 2, detailsY + 100, qrSize, qrSize);
    ctx.fillStyle = LIGHT;
    ctx.font = "22px Helvetica, Arial, sans-serif";
    ctx.fillText("Scan to verify", cx, detailsY + 100 + qrSize + 34);
  } catch {
    /* QR is a nice-to-have */
  }

  ctx.fillStyle = "#7a7a90";
  ctx.font = "22px Helvetica, Arial, sans-serif";
  ctx.fillText(`Verify at: ${data.verifyUrl}`, cx, H - 120);

  return canvas;
}

function fileBase(data: CertRenderData): string {
  const slug = data.courseName
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug || "certificate"}-certificate`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadCertificatePng(data: CertRenderData) {
  const canvas = await drawCertificate(data);
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `${fileBase(data)}.png`);
      resolve();
    }, "image/png");
  });
}

export async function downloadCertificatePdf(data: CertRenderData) {
  const canvas = await drawCertificate(data);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pw, ph);
  pdf.save(`${fileBase(data)}.pdf`);
}
