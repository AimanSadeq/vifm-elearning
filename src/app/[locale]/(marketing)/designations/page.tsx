import { Fragment } from "react";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadDesignationTiers } from "@/lib/site-content.server";
import { getCachedDesignations } from "@/lib/server/catalog-data";

/**
 * Public designations listing. Pure Server Component — no interactivity on
 * this page (just links into /designations/[slug]), so we don't need a
 * client wrapper at all.
 *
 * Data: Supabase `designations` table where `is_active = true`. Wrapped in
 * `unstable_cache({ revalidate: 60, tags: ["designations"] })` so repeating
 * visitors share one fetch per minute. Admins editing the table see their
 * change within ≤60s; for instant invalidation, call `revalidateTag(
 * "designations")` from any admin mutation route once one exists.
 */
export default async function DesignationsPage() {
  const locale = await getLocale();
  const [designations, tiers] = await Promise.all([
    getCachedDesignations(),
    loadDesignationTiers(),
  ]);
  const tierOrder = tiers.map((t) => t.id);
  const tierById = new Map(tiers.map((t) => [t.id, t]));

  const grouped = tierOrder
    .map((tier) => ({
      tier,
      items: designations.filter((d) => d.metadata?.tier_level === tier),
    }))
    .filter((g) => g.items.length > 0);

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
              ? `اكتشف ${designations.length} شهادة مهنية معتمدة عبر ثلاثة مستويات من التأسيسي إلى التنفيذي مصممة لتطوير مهاراتك المهنية.`
              : `Discover ${designations.length} accredited professional designations across three tiers from Gateway to Executive designed to advance your career in finance, AI, and business.`}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            {tiers.map((tier, i) => {
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
          const config = tierById.get(tier);
          if (!config) return null;
          const Icon = config.icon;

          return (
            <section key={tier}>
              {/* Tier Header */}
              <div
                className={`rounded-2xl bg-gradient-to-r ${config.gradient} p-6 sm:p-8 mb-6`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-6 w-6 text-foreground" />
                  <h2 className="text-2xl font-bold text-foreground">
                    {locale === "ar" ? config.labelAr : config.label}
                  </h2>
                  <Badge className={config.badgeColor}>
                    {items.length}{" "}
                    {locale === "ar"
                      ? "شهادات"
                      : items.length === 1
                        ? "certification"
                        : "certifications"}
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
