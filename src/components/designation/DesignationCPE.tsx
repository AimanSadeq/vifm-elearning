"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface CPECategory {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  annual_max_hours: number | null;
  requires_approval: boolean;
  sort_order: number;
}

interface DesignationCPEProps {
  cpeCategories: CPECategory[];
  abbreviation: string;
  cpeHours: number;
  cpeCycleYears: number;
  slug: string;
  locale: string;
}

const dotColors = [
  "bg-brand-600",
  "bg-info",
  "bg-accent-600",
  "bg-muted-foreground",
  "bg-success",
  "bg-purple-600",
  "bg-orange-600",
  "bg-rose-600",
];

export function DesignationCPE({
  cpeCategories,
  abbreviation,
  cpeHours,
  cpeCycleYears,
  slug,
  locale,
}: DesignationCPEProps) {
  if (cpeCategories.length === 0) return null;

  return (
    <AnimatedSection>
      <section className="relative overflow-hidden rounded-2xl bg-brand-950 px-8 py-12 text-white">
        {/* Dot pattern background overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Clock className="h-8 w-8 text-brand-400" />
            <h2 className="font-heading text-3xl font-bold">
              {locale === "ar"
                ? "التعليم المهني المستمر (CPE)"
                : "Continuing Professional Education"}
            </h2>
          </div>

          <p className="mb-8 text-center text-brand-200/80">
            {locale === "ar"
              ? `يجب على حاملي ${abbreviation} إكمال ${cpeHours} ساعة من CPE كل ${cpeCycleYears} سنوات للحفاظ على شهادتهم النشطة.`
              : `${abbreviation} holders must complete ${cpeHours} CPE hours every ${cpeCycleYears} years to maintain active certification.`}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cpeCategories.map((cat, i) => {
              const catName =
                locale === "ar" && cat.name_ar ? cat.name_ar : cat.name;
              const limit = cat.annual_max_hours
                ? locale === "ar"
                  ? `بحد أقصى ${cat.annual_max_hours} ساعات/سنة`
                  : `Max ${cat.annual_max_hours} hrs/year`
                : locale === "ar"
                  ? "غير محدود"
                  : "Unlimited";

              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
                >
                  <div
                    className={`h-3 w-3 shrink-0 rounded-full ${dotColors[i % dotColors.length]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{catName}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-brand-200">
                    {limit}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/designations/${slug}/cpe-policy`}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {locale === "ar"
                ? "عرض سياسة CPE الكاملة"
                : "View Full CPE Policy"}
              <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
