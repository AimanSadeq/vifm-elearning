import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { CertificateTemplateKey } from "@/types";

interface CertificateData {
  userName: string;
  courseName: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string;
}

export interface TemplateConfig {
  templateKey: CertificateTemplateKey;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  organizationName: string;
}

const DEFAULT_CONFIG: TemplateConfig = {
  templateKey: "classic",
  primaryColor: "#1A3A5F",
  secondaryColor: "#D4AF37",
  accentColor: "#646464",
  organizationName: "Virginia Institute of Finance and Management",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ---------------------------------------------------------------------------
// CLASSIC — Double navy border, gold decorative line, centered layout
// ---------------------------------------------------------------------------
function renderClassicTemplate(
  doc: jsPDF,
  data: CertificateData,
  config: TemplateConfig
) {
  const width = doc.internal.pageSize.getWidth();
  const primary = hexToRgb(config.primaryColor);
  const secondary = hexToRgb(config.secondaryColor);
  const accent = hexToRgb(config.accentColor);

  // Double border
  doc.setDrawColor(...primary);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, doc.internal.pageSize.getHeight() - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, doc.internal.pageSize.getHeight() - 28);

  // Header
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(config.organizationName.toUpperCase(), width / 2, 35, {
    align: "center",
  });

  // Title
  doc.setFontSize(32);
  doc.setTextColor(...primary);
  doc.text("Certificate of Completion", width / 2, 55, { align: "center" });

  // Gold decorative line
  doc.setDrawColor(...secondary);
  doc.setLineWidth(1);
  doc.line(width / 2 - 60, 62, width / 2 + 60, 62);

  // Body
  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text("This is to certify that", width / 2, 80, { align: "center" });

  doc.setFontSize(26);
  doc.setTextColor(...primary);
  doc.text(data.userName, width / 2, 95, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text("has successfully completed the course", width / 2, 112, {
    align: "center",
  });

  doc.setFontSize(20);
  doc.setTextColor(...primary);
  doc.text(data.courseName, width / 2, 127, { align: "center" });

  // Date
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text(`Issued on ${issuedDate}`, width / 2, 145, { align: "center" });

  // Certificate number
  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, width / 2, 155, {
    align: "center",
  });
}

// ---------------------------------------------------------------------------
// MODERN — Left color sidebar, clean minimal right-side content
// ---------------------------------------------------------------------------
function renderModernTemplate(
  doc: jsPDF,
  data: CertificateData,
  config: TemplateConfig
) {
  const height = doc.internal.pageSize.getHeight();
  const primary = hexToRgb(config.primaryColor);
  const secondary = hexToRgb(config.secondaryColor);
  const accent = hexToRgb(config.accentColor);

  // Left sidebar
  doc.setFillColor(...primary);
  doc.rect(0, 0, 45, height, "F");

  // Sidebar accent strip
  doc.setFillColor(...secondary);
  doc.rect(42, 0, 3, height, "F");

  // Sidebar text (vertical)
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(config.organizationName, 22, height / 2, {
    align: "center",
    angle: 90,
  });

  // Content area
  const contentX = 65;

  // Title
  doc.setFontSize(28);
  doc.setTextColor(...primary);
  doc.text("Certificate", contentX, 40);
  doc.setFontSize(16);
  doc.setTextColor(...accent);
  doc.text("of Completion", contentX, 52);

  // Horizontal accent line
  doc.setDrawColor(...secondary);
  doc.setLineWidth(2);
  doc.line(contentX, 58, contentX + 100, 58);

  // Presented to
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text("This certificate is presented to", contentX, 75);

  // Name
  doc.setFontSize(28);
  doc.setTextColor(...primary);
  doc.text(data.userName, contentX, 92);

  // Thin line under name
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.5);
  doc.line(contentX, 96, contentX + 150, 96);

  // Course text
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text("for successfully completing", contentX, 110);

  doc.setFontSize(18);
  doc.setTextColor(...primary);
  doc.text(data.courseName, contentX, 124);

  // Date and certificate number
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text(issuedDate, contentX, 148);
  doc.setFontSize(9);
  doc.text(`No: ${data.certificateNumber}`, contentX, 156);
}

// ---------------------------------------------------------------------------
// CORPORATE — Full-width header band, two-column footer, formal layout
// ---------------------------------------------------------------------------
function renderCorporateTemplate(
  doc: jsPDF,
  data: CertificateData,
  config: TemplateConfig
) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const primary = hexToRgb(config.primaryColor);
  const secondary = hexToRgb(config.secondaryColor);
  const accent = hexToRgb(config.accentColor);

  // Top header band
  doc.setFillColor(...primary);
  doc.rect(0, 0, width, 40, "F");

  // Header accent stripe
  doc.setFillColor(...secondary);
  doc.rect(0, 40, width, 4, "F");

  // Organization name in header
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(config.organizationName.toUpperCase(), width / 2, 25, {
    align: "center",
  });

  // Bottom band
  doc.setFillColor(...primary);
  doc.rect(0, height - 25, width, 25, "F");
  doc.setFillColor(...secondary);
  doc.rect(0, height - 25, width, 3, "F");

  // Bottom text
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, height - 10);

  // Title
  doc.setFontSize(30);
  doc.setTextColor(...primary);
  doc.text("Certificate of Completion", width / 2, 65, { align: "center" });

  // Body
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text("This is to certify that", width / 2, 82, { align: "center" });

  // Name with underline
  doc.setFontSize(26);
  doc.setTextColor(...primary);
  doc.text(data.userName, width / 2, 98, { align: "center" });
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.8);
  const nameWidth = doc.getTextWidth(data.userName);
  doc.line(
    width / 2 - nameWidth / 2,
    102,
    width / 2 + nameWidth / 2,
    102
  );

  // Course
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text("has successfully completed the course", width / 2, 116, {
    align: "center",
  });

  doc.setFontSize(20);
  doc.setTextColor(...primary);
  doc.text(data.courseName, width / 2, 132, { align: "center" });

  // Two-column footer area
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text(`Date: ${issuedDate}`, 30, 160);
  doc.text("Authorized Signature", width - 30, 160, { align: "right" });

  // Signature line
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.3);
  doc.line(width - 90, 155, width - 30, 155);
}

// ---------------------------------------------------------------------------
// ELEGANT — Decorative corners, centered script-style, circular seal element
// ---------------------------------------------------------------------------
function renderElegantTemplate(
  doc: jsPDF,
  data: CertificateData,
  config: TemplateConfig
) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const primary = hexToRgb(config.primaryColor);
  const secondary = hexToRgb(config.secondaryColor);
  const accent = hexToRgb(config.accentColor);

  // Outer thin border
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, width - 16, height - 16);

  // Corner ornaments (L-shapes)
  const cornerSize = 20;
  doc.setDrawColor(...secondary);
  doc.setLineWidth(1.5);
  // Top-left
  doc.line(15, 15, 15 + cornerSize, 15);
  doc.line(15, 15, 15, 15 + cornerSize);
  // Top-right
  doc.line(width - 15, 15, width - 15 - cornerSize, 15);
  doc.line(width - 15, 15, width - 15, 15 + cornerSize);
  // Bottom-left
  doc.line(15, height - 15, 15 + cornerSize, height - 15);
  doc.line(15, height - 15, 15, height - 15 - cornerSize);
  // Bottom-right
  doc.line(width - 15, height - 15, width - 15 - cornerSize, height - 15);
  doc.line(width - 15, height - 15, width - 15, height - 15 - cornerSize);

  // Organization name
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(config.organizationName, width / 2, 32, { align: "center" });

  // Top decorative line
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 50, 37, width / 2 + 50, 37);

  // Title
  doc.setFontSize(36);
  doc.setTextColor(...primary);
  doc.text("Certificate", width / 2, 56, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text("OF COMPLETION", width / 2, 65, { align: "center" });

  // Two decorative lines around "presented to"
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 80, 73, width / 2 - 30, 73);
  doc.line(width / 2 + 30, 73, width / 2 + 80, 73);

  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("Presented to", width / 2, 76, { align: "center" });

  // Name — large elegant text
  doc.setFontSize(30);
  doc.setTextColor(...primary);
  doc.text(data.userName, width / 2, 95, { align: "center" });

  // Decorative line under name
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 70, 100, width / 2 + 70, 100);

  // Course text
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text("for the successful completion of", width / 2, 113, {
    align: "center",
  });

  doc.setFontSize(18);
  doc.setTextColor(...primary);
  doc.text(data.courseName, width / 2, 127, { align: "center" });

  // Date
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text(`Issued on ${issuedDate}`, width / 2, 145, { align: "center" });

  // Circular seal element (bottom-left)
  doc.setDrawColor(...secondary);
  doc.setLineWidth(1);
  doc.circle(50, height - 45, 12);
  doc.circle(50, height - 45, 10);
  doc.setFontSize(7);
  doc.setTextColor(...secondary);
  doc.text("CERTIFIED", 50, height - 44, { align: "center" });

  // Certificate number
  doc.setFontSize(9);
  doc.setTextColor(...accent);
  doc.text(
    `Certificate No: ${data.certificateNumber}`,
    width / 2,
    height - 30,
    { align: "center" }
  );
}

// ---------------------------------------------------------------------------
// QR Code — shared across all templates (positioned at bottom-right)
// ---------------------------------------------------------------------------
async function renderQrCode(
  doc: jsPDF,
  verificationUrl: string,
  config: TemplateConfig
) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const accent = hexToRgb(config.accentColor);

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
  });
  doc.addImage(qrDataUrl, "PNG", width - 55, height - 55, 30, 30);

  doc.setFontSize(7);
  doc.setTextColor(...accent);
  doc.text("Scan to verify", width - 40, height - 22, { align: "center" });
}

// ---------------------------------------------------------------------------
// MAIN EXPORT — dispatcher
// ---------------------------------------------------------------------------
export async function generateCertificatePdf(
  data: CertificateData,
  template?: TemplateConfig
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const config = template ?? DEFAULT_CONFIG;

  switch (config.templateKey) {
    case "modern":
      renderModernTemplate(doc, data, config);
      break;
    case "corporate":
      renderCorporateTemplate(doc, data, config);
      break;
    case "elegant":
      renderElegantTemplate(doc, data, config);
      break;
    case "classic":
    default:
      renderClassicTemplate(doc, data, config);
      break;
  }

  // QR code is shared across all templates
  await renderQrCode(doc, data.verificationUrl, config);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
