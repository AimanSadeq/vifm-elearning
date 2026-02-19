"use client";

import { useLocale, useTranslations } from "next-intl";
import { Award, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/formatters";
import type { Certificate } from "@/types";

interface CertificateCardProps {
  certificate: Certificate & {
    course?: { title: string; title_ar?: string | null; slug?: string };
  };
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const locale = useLocale();
  const t = useTranslations("certificates");

  const courseName =
    locale === "ar" && certificate.course?.title_ar
      ? certificate.course.title_ar
      : certificate.course?.title ?? "";

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
          <div className="mt-4 flex gap-2">
            {certificate.pdf_url && (
              <a
                href={certificate.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 me-1" />
                  {t("download")}
                </Button>
              </a>
            )}
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
