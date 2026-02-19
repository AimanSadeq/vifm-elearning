"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface VerificationData {
  valid: boolean;
  certificate?: {
    certificateNumber: string;
    status: string;
    issuedAt: string;
    userName: string;
    courseName: string;
    courseNameAr?: string;
  };
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params.code as string;
  const locale = useLocale();
  const t = useTranslations("certificates");

  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const res = await fetch(`/api/certificates/verify?code=${code}`);
      const json = await res.json();
      setData(json.data ?? { valid: false });
      setIsLoading(false);
    }

    if (code) verify();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cert = data?.certificate;
  const courseName =
    locale === "ar" && cert?.courseNameAr
      ? cert.courseNameAr
      : cert?.courseName;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {data?.valid ? (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold">{t("verificationSuccess")}</h1>
              <Badge variant="success">{t("valid")}</Badge>

              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-mono text-xs">
                      {cert?.certificateNumber}
                    </span>
                  </div>

                  <p>
                    <span className="text-muted-foreground">
                      {t("issuedTo")}:{" "}
                    </span>
                    <span className="font-medium">{cert?.userName}</span>
                  </p>

                  <p>
                    <span className="text-muted-foreground">
                      {t("courseName")}:{" "}
                    </span>
                    <span className="font-medium">{courseName}</span>
                  </p>

                  <p>
                    <span className="text-muted-foreground">
                      {t("issuedOn")}:{" "}
                    </span>
                    <span>
                      {cert?.issuedAt
                        ? formatDate(cert.issuedAt, locale)
                        : "—"}
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold">{t("verificationFailed")}</h1>
              <p className="text-muted-foreground">
                This certificate could not be verified. It may have been revoked
                or does not exist.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
