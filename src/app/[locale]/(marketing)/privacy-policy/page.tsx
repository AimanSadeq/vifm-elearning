"use client";

import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacyPolicy");

  const sections = [
    { title: t("introTitle"), text: t("introText") },
    { title: t("collectTitle"), text: t("collectText") },
    { title: t("useTitle"), text: t("useText") },
    { title: t("shareTitle"), text: t("shareText") },
    { title: t("securityTitle"), text: t("securityText") },
    { title: t("cookiesTitle"), text: t("cookiesText") },
    { title: t("rightsTitle"), text: t("rightsText") },
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
