"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Building2,
  Users,
  BookOpen,
  Award,
  Globe,
  MapPin,
  TrendingUp,
  Landmark,
  Cpu,
  Home,
  ClipboardList,
  Target,
  BarChart3,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

interface RawStat {
  key: string;
  value: string;
  label: string;
  labelAr?: string;
}

// Icon mapping keyed by the stat's `key` field, so admins can swap copy
// freely but icons stay sensible. Unknown keys get a generic Award icon.
const STAT_ICONS: Record<string, LucideIcon> = {
  professionals: Users,
  clients: BookOpen,
  years: TrendingUp,
  learners: Users,
  courses: BookOpen,
  certificates: Award,
  instructors: Users,
  organizations: Building2,
  countries: Globe,
};

export default function AboutPage() {
  const t = useTranslations("about");
  const tl = useTranslations("landing");
  const locale = useLocale();
  const { offices: rawOffices } = useSiteSettings();
  const [rawStats, setRawStats] = useState<RawStat[] | null>(null);

  useEffect(() => {
    fetch("/api/site-settings/public")
      .then((r) => r.json())
      .then((j) => {
        const arr = j.data?.homepage_stats;
        if (Array.isArray(arr)) setRawStats(arr as RawStat[]);
      })
      .catch(() => {});
  }, []);

  // Defaults mirror the home page's social-proof stats so the two stay in
  // sync; the page never renders empty before the fetch resolves.
  const stats = (rawStats ?? [
    { key: "professionals", value: "50,000+", label: tl("statProfessionals") },
    { key: "clients", value: "125+", label: tl("statClients") },
    { key: "years", value: "25+", label: tl("statYears") },
  ]).map((s) => ({
    key: s.key,
    icon: STAT_ICONS[s.key] ?? Award,
    label: locale === "ar" && "labelAr" in s && s.labelAr ? s.labelAr : s.label,
    value: s.value,
  }));

  const offices = rawOffices.map((o) => ({
    key: o.key,
    city: locale === "ar" ? o.cityAr : o.city,
    address: locale === "ar" ? o.addressAr : o.address,
  }));

  const domains = [
    { icon: Landmark, title: t("domainFinance"), description: t("domainFinanceDesc") },
    { icon: Cpu, title: t("domainStrategy"), description: t("domainStrategyDesc") },
    { icon: Home, title: t("domainCompliance"), description: t("domainComplianceDesc") },
    { icon: ClipboardList, title: t("domainData"), description: t("domainDataDesc") },
    { icon: Target, title: t("domainStrategyMgmt"), description: t("domainStrategyMgmtDesc") },
    { icon: BarChart3, title: t("domainDataAnalytics"), description: t("domainDataAnalyticsDesc") },
    { icon: Wallet, title: t("domainFinanceAcc"), description: t("domainFinanceAccDesc") },
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
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.key}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 lg:p-8 shadow-sm transition-colors hover:shadow-md"
              >
                {/* Accent corner glow */}
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-brand-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <stat.icon className="h-6 w-6 text-brand-400 mb-4" />
                  <div className="text-3xl font-bold text-foreground lg:text-4xl">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
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
              <Card key={office.key}>
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
