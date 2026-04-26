"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Calendar, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils/formatters";
import type { SubscriptionStatus, SubscriptionPlan } from "@/types";

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  plan_id?: string | null;
  plan_name?: string;
  plan_name_ar?: string;
}

interface AvailablePlan {
  id: string;
  name: string;
  name_ar?: string | null;
  plan_type: SubscriptionPlan;
  price: number;
  currency: string;
}

export default function UserSubscriptionPage() {
  const locale = useLocale();
  const t = useTranslations("subscriptions");
  const { user, isLoading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const supabase = createClient();

      // Fetch user's active subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select(
          `
          id, plan, status, price, currency,
          current_period_start, current_period_end,
          cancel_at_period_end, cancelled_at, plan_id,
          subscription_plans:plan_id (name, name_ar)
        `
        )
        .eq("user_id", user.id)
        .in("status", ["active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subData) {
        const planInfo = subData.subscription_plans as unknown as {
          name?: string;
          name_ar?: string;
        } | null;
        setSubscription({
          ...(subData as unknown as UserSubscription),
          plan_name: planInfo?.name,
          plan_name_ar: planInfo?.name_ar,
        });
      }

      // Fetch available plans for changing
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, name, name_ar, plan_type, price, currency")
        .eq("is_active", true)
        .order("sort_order");

      setAvailablePlans((plans as AvailablePlan[]) ?? []);
      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading]);

  async function handleCancel() {
    if (
      !confirm(
        t("cancelConfirm") ??
          "Are you sure you want to cancel your subscription?"
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      });

      if (res.ok) {
        setSubscription((prev) =>
          prev
            ? {
                ...prev,
                cancel_at_period_end: true,
                cancelled_at: new Date().toISOString(),
              }
            : null
        );
      } else {
        const json = await res.json();
        alert(json.error || "Failed to cancel");
      }
    } catch {
      alert("Something went wrong");
    }
    setIsCancelling(false);
  }

  async function handleChangePlan(newPlanId: string) {
    setIsChanging(true);
    try {
      const res = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId }),
      });

      if (res.ok) {
        // Reload to get updated subscription
        window.location.reload();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to change plan");
      }
    } catch {
      alert("Something went wrong");
    }
    setIsChanging(false);
    setShowPlanSelector(false);
  }

  function getStatusBadge(status: SubscriptionStatus) {
    switch (status) {
      case "active":
        return <Badge variant="success">{t("active")}</Badge>;
      case "cancelled":
        return <Badge variant="secondary">{t("cancelled")}</Badge>;
      case "expired":
        return <Badge variant="destructive">{t("expired")}</Badge>;
      case "past_due":
        return <Badge variant="warning">{t("pastDue")}</Badge>;
    }
  }

  function getPlanLabel(type: SubscriptionPlan) {
    const labels: Record<SubscriptionPlan, string> = {
      monthly: t("monthly"),
      quarterly: t("quarterly"),
      annual: t("annual"),
      lifetime: t("lifetime"),
    };
    return labels[type] ?? type;
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">
          {t("mySubscription")}
        </h1>
        <EmptyState
          icon={CreditCard}
          title={t("noSubscription")}
          description={t("noSubscriptionDescription")}
          action={
            <Link href={`/${locale}/pricing`}>
              <Button>{t("viewPlans")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const planName =
    locale === "ar" && subscription.plan_name_ar
      ? subscription.plan_name_ar
      : subscription.plan_name ?? getPlanLabel(subscription.plan);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("mySubscription")}
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{planName}</h2>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("plan")}</p>
              <p className="font-medium">{getPlanLabel(subscription.plan)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("price")}</p>
              <p className="font-medium">
                ${subscription.price} {subscription.currency}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("status")}</p>
              <div>{getStatusBadge(subscription.status)}</div>
            </div>
          </div>

          {/* Billing period */}
          {(subscription.current_period_start ||
            subscription.current_period_end) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {subscription.current_period_start
                  ? formatDate(subscription.current_period_start)
                  : "—"}{" "}
                →{" "}
                {subscription.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "—"}
              </span>
            </div>
          )}

          {/* Cancel notice */}
          {subscription.cancel_at_period_end && (
            <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{t("cancelNotice")}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch("/api/subscriptions/portal", {
                  method: "POST",
                });
                const json = await res.json();
                if (res.ok && json.data?.url) {
                  window.location.href = json.data.url;
                } else {
                  alert(json.error ?? "Could not open billing portal");
                }
              }}
            >
              {locale === "ar" ? "إدارة الفوترة" : "Manage billing"}
            </Button>
            {!subscription.cancel_at_period_end &&
              subscription.plan !== "lifetime" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowPlanSelector(!showPlanSelector)
                    }
                  >
                    {t("changePlan")}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isCancelling}
                    onClick={handleCancel}
                  >
                    {isCancelling
                      ? t("cancelling") ?? "Cancelling..."
                      : t("cancelSubscription")}
                  </Button>
                </>
              )}
          </div>

          {/* Plan selector */}
          {showPlanSelector && (
            <div className="space-y-2 rounded-md border p-4">
              <p className="text-sm font-medium">{t("selectNewPlan")}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {availablePlans
                  .filter(
                    (p) =>
                      p.id !== subscription.plan_id &&
                      p.plan_type !== "lifetime"
                  )
                  .map((plan) => {
                    const name =
                      locale === "ar" && plan.name_ar
                        ? plan.name_ar
                        : plan.name;
                    return (
                      <Button
                        key={plan.id}
                        variant="outline"
                        disabled={isChanging}
                        onClick={() => handleChangePlan(plan.id)}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">
                          ${plan.price} {plan.currency}
                        </span>
                      </Button>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
