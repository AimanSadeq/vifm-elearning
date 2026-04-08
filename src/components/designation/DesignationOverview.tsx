"use client";

import { Shield, BookOpen, Clock } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface DesignationOverviewProps {
  abbreviation: string;
  description: string;
  documentsCount: number;
  cpeHours: number;
  cpeCycleYears: number;
  locale: string;
}

export function DesignationOverview({
  abbreviation,
  description,
  documentsCount,
  cpeHours,
  cpeCycleYears,
  locale,
}: DesignationOverviewProps) {
  const infoCards = [
    {
      icon: Shield,
      labelEn: "Industry Recognized",
      labelAr: "معترف بها صناعيا",
    },
    {
      icon: BookOpen,
      labelEn:
        documentsCount > 0
          ? `${documentsCount} Modules`
          : "Comprehensive Curriculum",
      labelAr:
        documentsCount > 0 ? `${documentsCount} وحدات` : "منهج شامل",
    },
    {
      icon: Clock,
      labelEn: `${cpeHours} CPE Hours / ${cpeCycleYears === 1 ? "Year" : `${cpeCycleYears} Years`}`,
      labelAr: `${cpeHours} ساعة CPE / ${cpeCycleYears === 1 ? "سنة" : `${cpeCycleYears} سنوات`}`,
    },
  ];

  return (
    <AnimatedSection>
      <section className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-3xl font-bold">
          {locale === "ar"
            ? `ما هي شهادة ${abbreviation}؟`
            : `What is ${abbreviation}?`}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {infoCards.map((card) => {
            const label = locale === "ar" ? card.labelAr : card.labelEn;
            return (
              <div
                key={card.labelEn}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                <card.icon className="h-5 w-5 shrink-0 text-brand-600" />
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedSection>
  );
}
