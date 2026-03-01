"use client";

import { useTranslations } from "next-intl";
import { CreateCertificationForm } from "@/components/admin/CreateCertificationForm";

export default function CreateCertificationPage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("createCertification")}
      </h1>
      <CreateCertificationForm />
    </div>
  );
}
