"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionPlan } from "@/types";

interface PlanFromDb {
  id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  plan_type: SubscriptionPlan;
  price: number;
  currency: string;
  features: string[];
  features_ar?: string[];
  sort_order: number;
}

function getPeriodLabel(type: SubscriptionPlan, locale: string) {
  const map: Record<SubscriptionPlan, { en: string; ar: string }> = {
    monthly: { en: "/month", ar: "/شهر" },
    quarterly: { en: "/3 months", ar: "/3 أشهر" },
    annual: { en: "/year", ar: "/سنة" },
    lifetime: { en: "one-time", ar: "دفعة واحدة" },
  };
  return locale === "ar" ? map[type].ar : map[type].en;
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [plans, setPlans] = useState<PlanFromDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      const supabase = createClient();
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setPlans((data as PlanFromDb[]) ?? []);
      setIsLoading(false);
    }
    fetchPlans();
  }, []);

  async function handleSubscribe(planId: string) {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    setSubscribingId(planId);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();

      if (res.ok && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        alert(json.error || "Failed to start checkout");
      }
    } catch {
      alert("Something went wrong");
    }
    setSubscribingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Determine which plan is "popular" (annual by convention)
  const popularType: SubscriptionPlan = "annual";

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
            const name =
              locale === "ar" && plan.name_ar ? plan.name_ar : plan.name;
            const description =
              locale === "ar" && plan.description_ar
                ? plan.description_ar
                : plan.description;
            const features =
              locale === "ar" && plan.features_ar?.length
                ? plan.features_ar
                : plan.features;
            const period = getPeriodLabel(plan.plan_type, locale);
            const isPopular = plan.plan_type === popularType;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col",
                  isPopular && "border-brand-600 border-2 shadow-lg"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <Badge className="bg-brand-600 text-white">
                      {t("mostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  {description && (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground ms-1">
                      {period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {(features ?? []).map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-6"
                    variant={isPopular ? "default" : "outline"}
                    disabled={subscribingId === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {subscribingId === plan.id
                      ? t("processing") ?? "Processing..."
                      : t("getStarted")}
                  </Button>
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
