"use client";

import { useTranslations } from "next-intl";
import { CertificateCard } from "./CertificateCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Certificate } from "@/types";

interface CertificateListProps {
  certificates: (Certificate & {
    course?: { title: string | null; title_ar?: string | null; slug?: string };
  })[];
}

export function CertificateList({ certificates }: CertificateListProps) {
  const t = useTranslations("certificates");

  if (certificates.length === 0) {
    return (
      <EmptyState
        title={t("myCertificates")}
        description="Complete courses to earn certificates."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert) => (
        <CertificateCard key={cert.id} certificate={cert} />
      ))}
    </div>
  );
}
