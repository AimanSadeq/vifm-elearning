"use client";

import { useTranslations } from "next-intl";

export default function TermsOfServicePage() {
  const t = useTranslations("termsOfService");

  const sections = [
    { title: t("introTitle"), text: t("introText") },
    { title: t("accountTitle"), text: t("accountText") },
    { title: t("enrollmentTitle"), text: t("enrollmentText") },
    { title: t("paymentTitle"), text: t("paymentText") },
    { title: t("contentTitle"), text: t("contentText") },
    { title: t("conductTitle"), text: t("conductText") },
    { title: t("certificatesTitle"), text: t("certificatesText") },
    { title: t("corporateTitle"), text: t("corporateText") },
    { title: t("disclaimerTitle"), text: t("disclaimerText") },
    { title: t("liabilityTitle"), text: t("liabilityText") },
    { title: t("changesTitle"), text: t("changesText") },
    { title: t("contactTitle"), text: t("contactText") },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {section.text}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
