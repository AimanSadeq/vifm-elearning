"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  DESIGNATION_TIERS,
  DESIGNATION_TIER_IDS,
  getDesignationTier,
} from "@/lib/site-content";

interface Designation {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  abbreviation: string;
  description: string | null;
  description_ar: string | null;
  founding_fee: number;
  currency: string;
  metadata: { tier_level?: string } | null;
}

const TIER_ORDER = DESIGNATION_TIER_IDS;

export default function DesignationsPage() {
  const locale = useLocale();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDesignations() {
      const supabase = createClient();
      const { data } = await supabase
        .from("designations")
        .select(
          "id, name, name_ar, slug, abbreviation, description, description_ar, founding_fee, currency, metadata"
        )
        .eq("is_active", true)
        .order("name");

      setDesignations((data as Designation[]) ?? []);
      setIsLoading(false);
    }

    fetchDesignations();
  }, []);

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: designations.filter(
      (d) => d.metadata?.tier_level === tier
    ),
  })).filter((g) => g.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 py-16 text-white sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Award className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            {locale === "ar"
              ? "ابدأ رحلتك التعليمية"
              : "Start Your Learning Journey"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {locale === "ar"
              ? `اكتشف ${designations.length} شهادة مهنية معتمدة عبر ثلاثة مستويات — من التأسيسي إلى التنفيذي — مصممة لتطوير مهاراتك المهنية.`
              : `Discover ${designations.length} accredited professional designations across three tiers — from Gateway to Executive — designed to advance your career in finance, AI, and business.`}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            {DESIGNATION_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const count =
                grouped.find((g) => g.tier === tier.id)?.items.length ?? 0;
              const shortLabel =
                locale === "ar"
                  ? tier.labelAr.replace("المستوى ", "")
                  : tier.label.replace(" Tier", "");
              return (
                <Fragment key={tier.id}>
                  {i > 0 && <span className="hidden sm:inline">·</span>}
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    {count} {shortLabel}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Sections */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {grouped.map(({ tier, items }) => {
          const config = getDesignationTier(tier);
          if (!config) return null;
          const Icon = config.icon;

          return (
            <section key={tier}>
              {/* Tier Header */}
              <div className={`rounded-2xl bg-gradient-to-r ${config.gradient} p-6 sm:p-8 mb-6`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-6 w-6 text-foreground" />
                  <h2 className="text-2xl font-bold text-foreground">
                    {locale === "ar" ? config.labelAr : config.label}
                  </h2>
                  <Badge className={config.badgeColor}>
                    {items.length}{" "}
                    {locale === "ar" ? "شهادات" : items.length === 1 ? "certification" : "certifications"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {locale === "ar" ? config.descriptionAr : config.description}
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => {
                  const name =
                    locale === "ar" && d.name_ar ? d.name_ar : d.name;
                  const desc =
                    locale === "ar" && d.description_ar
                      ? d.description_ar
                      : d.description;

                  return (
                    <Link
                      key={d.id}
                      href={`/${locale}/designations/${d.slug}`}
                    >
                      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/30">
                        <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                          {/* Abbreviation + Fee */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center justify-center rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                              {d.abbreviation}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {d.founding_fee === 0
                                ? locale === "ar"
                                  ? "مجاني"
                                  : "Free"
                                : `$${d.founding_fee}`}
                            </span>
                          </div>

                          {/* Name */}
                          <h3 className="font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                            {name}
                          </h3>

                          {/* Description */}
                          {desc && (
                            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                              {desc}
                            </p>
                          )}

                          {/* CTA */}
                          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                            {locale === "ar" ? "عرض التفاصيل" : "View Details"}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
