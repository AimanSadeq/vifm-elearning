"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  nameAr: string;
  price: number;
  period: string;
  periodAr: string;
  description: string;
  descriptionAr: string;
  features: PlanFeature[];
  popular?: boolean;
  savings?: string;
}

const plans: PricingPlan[] = [
  {
    name: "Monthly",
    nameAr: "شهري",
    price: 49,
    period: "/month",
    periodAr: "/شهر",
    description: "Perfect for getting started",
    descriptionAr: "مثالي للبدء",
    features: [
      { text: "Access to all courses", included: true },
      { text: "Course certificates", included: true },
      { text: "Discussion forums", included: true },
      { text: "Mobile access", included: true },
      { text: "Webinar access", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Quarterly",
    nameAr: "ربع سنوي",
    price: 129,
    period: "/3 months",
    periodAr: "/3 أشهر",
    description: "Most flexible option",
    descriptionAr: "الخيار الأكثر مرونة",
    savings: "Save 12%",
    features: [
      { text: "Access to all courses", included: true },
      { text: "Course certificates", included: true },
      { text: "Discussion forums", included: true },
      { text: "Mobile access", included: true },
      { text: "Webinar access", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Annual",
    nameAr: "سنوي",
    price: 399,
    period: "/year",
    periodAr: "/سنة",
    description: "Best value for committed learners",
    descriptionAr: "أفضل قيمة للمتعلمين الملتزمين",
    popular: true,
    savings: "Save 32%",
    features: [
      { text: "Access to all courses", included: true },
      { text: "Course certificates", included: true },
      { text: "Discussion forums", included: true },
      { text: "Mobile access", included: true },
      { text: "Webinar access", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    name: "Lifetime",
    nameAr: "مدى الحياة",
    price: 999,
    period: "one-time",
    periodAr: "دفعة واحدة",
    description: "Unlimited access forever",
    descriptionAr: "وصول غير محدود للأبد",
    savings: "Best deal",
    features: [
      { text: "Access to all courses", included: true },
      { text: "Course certificates", included: true },
      { text: "Discussion forums", included: true },
      { text: "Mobile access", included: true },
      { text: "Webinar access", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function PricingPage() {
  const t = useTranslations("pricing");
  const locale = useLocale();

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const name = locale === "ar" ? plan.nameAr : plan.name;
            const description =
              locale === "ar" ? plan.descriptionAr : plan.description;
            const period = locale === "ar" ? plan.periodAr : plan.period;

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col",
                  plan.popular && "border-brand-600 border-2 shadow-lg"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <Badge className="bg-brand-600 text-white">
                      {t("mostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ms-1">
                      {period}
                    </span>
                  </div>
                  {plan.savings && (
                    <Badge variant="success" className="mt-2">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.text}
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          !feature.included && "text-muted-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            feature.included
                              ? "text-success"
                              : "text-muted-foreground/30"
                          )}
                        />
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/${locale}/register`} className="mt-6 block">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {t("getStarted")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Corporate CTA */}
        <div className="mt-16 text-center rounded-2xl bg-muted/50 p-8 sm:p-12">
          <h2 className="text-2xl font-bold">{t("corporateTitle")}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t("corporateSubtitle")}
          </p>
          <Link href={`/${locale}/contact`}>
            <Button size="lg" className="mt-6">
              {t("contactSales")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
