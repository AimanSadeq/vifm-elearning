"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CHRSDesignationPage() {
  const t = useTranslations("designations.chrs");
  const locale = useLocale();

  const highlights = [
    { icon: Clock, label: t("highlightDuration"), value: t("highlightDurationValue") },
    { icon: BookOpen, label: t("highlightModules"), value: t("highlightModulesValue") },
    { icon: Award, label: t("highlightCredential"), value: t("highlightCredentialValue") },
    { icon: Users, label: t("highlightFormat"), value: t("highlightFormatValue") },
  ];

  const modules = [
    { title: t("module1Title"), description: t("module1Desc") },
    { title: t("module2Title"), description: t("module2Desc") },
    { title: t("module3Title"), description: t("module3Desc") },
    { title: t("module4Title"), description: t("module4Desc") },
    { title: t("module5Title"), description: t("module5Desc") },
    { title: t("module6Title"), description: t("module6Desc") },
  ];

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
    t("benefit5"),
    t("benefit6"),
  ];

  const audience = [
    { icon: Briefcase, label: t("audience1") },
    { icon: Users, label: t("audience2") },
    { icon: Target, label: t("audience3") },
    { icon: GraduationCap, label: t("audience4") },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/20 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 mb-4">
            <Award className="h-4 w-4" />
            {t("badge")}
          </div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/contact`}>
              <Button size="lg">{t("applyNow")}</Button>
            </Link>
            <Link href={`/${locale}/courses`}>
              <Button variant="outline" size="lg">
                {t("exploreCourses")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlights */}
        <section className="mb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/20">
                    <item.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <p className="mt-3 text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Overview */}
        <section className="mb-16">
          <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/20 p-8 sm:p-12">
            <h2 className="text-2xl font-bold mb-4 text-center">{t("overviewTitle")}</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed text-center">
              {t("overviewText")}
            </p>
          </div>
        </section>

        {/* Who Should Attend */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t("audienceTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {audience.map((item) => (
              <Card key={item.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-950/20">
                    <item.icon className="h-5 w-5 text-accent-600" />
                  </div>
                  <p className="font-medium">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t("curriculumTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((mod, index) => (
              <Card key={mod.title}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{mod.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t("benefitsTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                <p className="text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="rounded-2xl bg-brand-600 p-8 sm:p-12 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">{t("ctaTitle")}</h2>
            <p className="text-brand-100 max-w-2xl mx-auto mb-8">
              {t("ctaText")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  variant="secondary"
                >
                  {t("applyNow")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
