"use client";

import { useTranslations } from "next-intl";
import {
  Building2,
  Users,
  BookOpen,
  Award,
  Globe,
  Target,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const t = useTranslations("about");

  const stats = [
    { icon: Users, label: t("statLearners"), value: "10,000+" },
    { icon: BookOpen, label: t("statCourses"), value: "200+" },
    { icon: Award, label: t("statCertificates"), value: "5,000+" },
    { icon: Building2, label: t("statOrganizations"), value: "50+" },
  ];

  const offices = [
    {
      city: "Dubai, UAE",
      cityAr: "دبي، الإمارات",
      address: "DIFC, Gate Village Building 3",
    },
    {
      city: "Riyadh, KSA",
      cityAr: "الرياض، المملكة العربية السعودية",
      address: "King Fahd Road, Olaya District",
    },
    {
      city: "Virginia, USA",
      cityAr: "فيرجينيا، الولايات المتحدة",
      address: "Tysons Corner Center",
    },
  ];

  const domains = [
    { icon: Target, title: t("domainFinance"), description: t("domainFinanceDesc") },
    { icon: Globe, title: t("domainStrategy"), description: t("domainStrategyDesc") },
    { icon: Award, title: t("domainCompliance"), description: t("domainComplianceDesc") },
    { icon: BookOpen, title: t("domainData"), description: t("domainDataDesc") },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/20 p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">{t("missionTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("missionText")}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <stat.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Domain Expertise */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("expertiseTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {domains.map((domain) => (
              <Card key={domain.title}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50">
                    <domain.icon className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{domain.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {domain.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Offices */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("officesTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {offices.map((office) => (
              <Card key={office.city}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                    <MapPin className="h-5 w-5 text-info" />
                  </div>
                  <h3 className="mt-3 font-semibold">{office.city}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {office.address}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
