"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Award, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/formatters";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/utils/certificate-render";
import type { Certificate } from "@/types";

interface CertificateCardProps {
  certificate: Certificate & {
    course?: { title: string | null; title_ar?: string | null; slug?: string };
  };
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const locale = useLocale();
  const t = useTranslations("certificates");
  const { user } = useAuth();
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);

  const courseName =
    locale === "ar" && certificate.course?.title_ar
      ? certificate.course.title_ar
      : certificate.course?.title ?? "";

  const handleDownload = async (format: "pdf" | "png") => {
    setBusy(format);
    try {
      const data = {
        learnerName: user?.full_name ?? "",
        courseName,
        certificateNumber: certificate.certificate_number,
        issuedAt: certificate.issued_at,
        verifyUrl:
          certificate.verification_url ??
          `${window.location.origin}/verify/${certificate.verification_code}`,
      };
      if (format === "pdf") await downloadCertificatePdf(data);
      else await downloadCertificatePng(data);
    } catch {
      alert("Could not generate the certificate. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const statusBadge = () => {
    switch (certificate.status) {
      case "issued":
        return <Badge variant="success">{t("valid")}</Badge>;
      case "revoked":
        return <Badge variant="destructive">{t("revoked")}</Badge>;
      case "expired":
        return <Badge variant="warning">{t("expired")}</Badge>;
    }
  };

  const handleShare = async () => {
    const verifyUrl = certificate.verification_url ??
      `${window.location.origin}/verify/${certificate.verification_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${courseName}`,
          text: `I earned a certificate for completing ${courseName} at VIFM Academy!`,
          url: verifyUrl,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(verifyUrl);
      alert("Verification link copied to clipboard!");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{courseName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("certificateNumber")}: {certificate.certificate_number}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("issuedOn")}: {formatDate(certificate.issued_at, locale)}
            </p>
            <div className="mt-2">{statusBadge()}</div>
          </div>
        </div>

        {certificate.status === "issued" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => handleDownload("pdf")}
            >
              {busy === "pdf" ? (
                <Loader2 className="h-4 w-4 me-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 me-1" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => handleDownload("png")}
            >
              {busy === "png" ? (
                <Loader2 className="h-4 w-4 me-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 me-1" />
              )}
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 me-1" />
              Share
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
