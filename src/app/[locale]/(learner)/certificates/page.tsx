"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CertificateList } from "@/components/certificates/CertificateList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Certificate } from "@/types";

export default function CertificatesPage() {
  const t = useTranslations("certificates");

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      const res = await fetch("/api/certificates");
      const { data } = await res.json();
      setCertificates(data ?? []);
      setIsLoading(false);
    }

    fetchCertificates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("myCertificates")}
      </h1>
      <CertificateList certificates={certificates} />
    </div>
  );
}
