import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  userName: string;
  courseName: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string;
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background border
  doc.setDrawColor(26, 58, 95); // VIFM navy
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Header
  doc.setFontSize(14);
  doc.setTextColor(26, 58, 95);
  doc.text("VIRGINIA INSTITUTE OF FINANCE AND MANAGEMENT", width / 2, 35, {
    align: "center",
  });

  // Title
  doc.setFontSize(32);
  doc.setTextColor(26, 58, 95);
  doc.text("Certificate of Completion", width / 2, 55, { align: "center" });

  // Decorative line
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(1);
  doc.line(width / 2 - 60, 62, width / 2 + 60, 62);

  // Body
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("This is to certify that", width / 2, 80, { align: "center" });

  doc.setFontSize(26);
  doc.setTextColor(26, 58, 95);
  doc.text(data.userName, width / 2, 95, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("has successfully completed the course", width / 2, 112, {
    align: "center",
  });

  doc.setFontSize(20);
  doc.setTextColor(26, 58, 95);
  doc.text(data.courseName, width / 2, 127, { align: "center" });

  // Date
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Issued on ${issuedDate}`, width / 2, 145, { align: "center" });

  // Certificate number
  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, width / 2, 155, {
    align: "center",
  });

  // QR code
  const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 200,
    margin: 1,
  });
  doc.addImage(qrDataUrl, "PNG", width - 55, height - 55, 30, 30);

  doc.setFontSize(7);
  doc.text("Scan to verify", width - 40, height - 22, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
