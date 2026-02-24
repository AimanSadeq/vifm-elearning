import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      memberNumber,
      certifiedAt,
      designationName,
      abbreviation,
      tierName,
      tierSlug,
      verifyUrl,
      locale = "en",
    } = body;

    if (!fullName || !memberNumber || !certifiedAt || !abbreviation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user owns this holder record
    const { data: holder } = await supabase
      .from("designation_holders")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("member_number", memberNumber)
      .in("status", ["active", "grace_period"])
      .single();

    if (!holder) {
      return NextResponse.json({ error: "Active holder record not found" }, { status: 403 });
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });

    // Build PDF certificate (landscape A4)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const centerX = pageWidth / 2;

    // Background
    doc.setFillColor(26, 26, 46); // Dark navy
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Inner border
    doc.setDrawColor(200, 170, 100); // Gold
    doc.setLineWidth(0.8);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.3);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    // Header - VIFM
    doc.setTextColor(200, 170, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("VIRGINIA INSTITUTE OF FINANCE AND MANAGEMENT", centerX, 30, {
      align: "center",
    });

    // Decorative line
    doc.setDrawColor(200, 170, 100);
    doc.setLineWidth(0.5);
    doc.line(centerX - 60, 35, centerX + 60, 35);

    // "This certifies that"
    doc.setTextColor(180, 180, 200);
    doc.setFontSize(11);
    doc.text("This is to certify that", centerX, 50, { align: "center" });

    // Full Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(fullName, centerX, 68, { align: "center" });

    // Decorative line under name
    doc.setDrawColor(200, 170, 100);
    doc.setLineWidth(0.3);
    doc.line(centerX - 50, 73, centerX + 50, 73);

    // "has earned the designation of"
    doc.setTextColor(180, 180, 200);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("has earned the professional designation of", centerX, 85, {
      align: "center",
    });

    // Designation Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(designationName || abbreviation, centerX, 100, {
      align: "center",
    });

    // Abbreviation
    doc.setTextColor(200, 170, 100);
    doc.setFontSize(16);
    doc.text(`(${abbreviation})`, centerX, 110, { align: "center" });

    // Founding Member badge
    if (tierSlug === "founding-member") {
      doc.setFillColor(180, 140, 60);
      const badgeWidth = 50;
      const badgeHeight = 8;
      const badgeX = centerX - badgeWidth / 2;
      doc.roundedRect(badgeX, 115, badgeWidth, badgeHeight, 2, 2, "F");
      doc.setTextColor(26, 26, 46);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("★ FOUNDING MEMBER", centerX, 120.5, { align: "center" });
    }

    // Details row
    const detailsY = tierSlug === "founding-member" ? 138 : 130;

    doc.setTextColor(150, 150, 170);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Certified date
    const certDate = new Date(certifiedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text("Date of Certification", centerX - 50, detailsY, {
      align: "center",
    });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(certDate, centerX - 50, detailsY + 6, { align: "center" });

    // Member number
    doc.setTextColor(150, 150, 170);
    doc.setFontSize(8);
    doc.text("Member Number", centerX + 50, detailsY, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(memberNumber, centerX + 50, detailsY + 6, { align: "center" });

    // QR Code
    const qrSize = 22;
    const qrX = pageWidth - 40;
    const qrY = pageHeight - 45;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // QR label
    doc.setTextColor(150, 150, 170);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 4, {
      align: "center",
    });

    // Footer
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(7);
    doc.text(
      `Verify at: ${verifyUrl}`,
      centerX,
      pageHeight - 18,
      { align: "center" }
    );

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${abbreviation}_Certificate_${memberNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
