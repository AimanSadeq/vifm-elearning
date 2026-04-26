"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CreditCard,
  Building2,
  ChevronLeft,
  Tag,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatters";

type PaymentMethodType = "stripe" | "paytabs" | "bank_transfer";

interface Plan {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  plan_type: "monthly" | "quarterly" | "annual" | "lifetime";
  price: number;
  currency: string;
  features: string[];
  features_ar?: string[];
  metadata?: { is_popular?: boolean } | null;
}

const PERIOD_LABELS: Record<Plan["plan_type"], { en: string; ar: string }> = {
  monthly: { en: "/month", ar: "/شهر" },
  quarterly: { en: "/3 months", ar: "/٣ أشهر" },
  annual: { en: "/year", ar: "/سنة" },
  lifetime: { en: "one-time", ar: "دفعة واحدة" },
};

function CheckoutInner() {
  const params = useSearchParams();
  const planId = params.get("plan");
  const locale = useLocale();
  const t = useTranslations("payments");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState<Record<string, string> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPlan() {
      const supabase = createClient();
      if (!planId) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPlan(data as Plan);
        setFinalPrice(Number(data.price));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        if (existing) setHasActiveSub(true);
      }

      setIsLoading(false);
    }
    fetchPlan();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const handleApplyPromo = async () => {
    if (!promoCode || !plan) return;
    setPromoError("");
    const res = await fetch("/api/subscriptions/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, planId: plan.id }),
    });
    const { data } = await res.json();
    if (data?.valid) {
      setPromoApplied(true);
      setDiscount(data.discountAmount);
      setFinalPrice(data.finalPrice);
    } else {
      setPromoError(data?.reason ?? "Invalid promo code");
    }
  };

  const handleCheckout = async () => {
    if (!plan) return;
    setError(null);
    setIsProcessing(true);
    try {
      if (selectedMethod === "bank_transfer") {
        const res = await fetch("/api/subscriptions/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            promoCode: promoApplied ? promoCode : undefined,
          }),
        });
        const { data, error: err } = await res.json();
        if (err) {
          setError(err);
          return;
        }
        setBankDetails(data.bankDetails);
        return;
      }

      const endpoint =
        selectedMethod === "stripe"
          ? "/api/subscriptions/checkout"
          : "/api/subscriptions/paytabs";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          promoCode: promoApplied ? promoCode : undefined,
        }),
      });
      const { data, error: err } = await res.json();
      if (err) {
        setError(err);
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!planId || !plan) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "ar" ? "الباقة غير موجودة" : "Plan not found"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "يرجى اختيار باقة من صفحة الأسعار."
            : "Please pick a plan from the pricing page."}
        </p>
        <Link href={`/${locale}/pricing`}>
          <Button className="mt-6">
            {locale === "ar" ? "عرض الأسعار" : "View pricing"}
          </Button>
        </Link>
      </div>
    );
  }

  if (hasActiveSub) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {locale === "ar"
            ? "لديك اشتراك نشط بالفعل"
            : "You already have an active subscription"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "ar"
            ? "يمكنك إدارة اشتراكك من صفحة الاشتراك."
            : "You can manage your plan from the subscription page."}
        </p>
        <Link href={`/${locale}/subscription`}>
          <Button className="mt-6">
            {locale === "ar" ? "إدارة الاشتراك" : "Manage subscription"}
          </Button>
        </Link>
      </div>
    );
  }

  const planName = locale === "ar" && plan.name_ar ? plan.name_ar : plan.name;
  const planDesc =
    locale === "ar" && plan.description_ar
      ? plan.description_ar
      : plan.description;
  const features =
    locale === "ar" && plan.features_ar?.length
      ? plan.features_ar
      : plan.features;
  const period =
    PERIOD_LABELS[plan.plan_type][locale === "ar" ? "ar" : "en"];

  if (bankDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <Building2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold">{t("bankTransfer")}</h2>
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "يرجى تحويل" : "Please transfer"}{" "}
              <strong>
                {formatCurrency(finalPrice, plan.currency, locale)}
              </strong>{" "}
              {locale === "ar"
                ? "إلى الحساب التالي:"
                : "to the account below:"}
            </p>
            <div className="rounded-lg bg-muted p-4 text-start text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Bank: </span>
                {bankDetails.bankName}
              </p>
              <p>
                <span className="text-muted-foreground">Account: </span>
                {bankDetails.accountName}
              </p>
              <p>
                <span className="text-muted-foreground">IBAN: </span>
                {bankDetails.iban}
              </p>
              <p>
                <span className="text-muted-foreground">SWIFT: </span>
                {bankDetails.swiftCode}
              </p>
              <p>
                <span className="text-muted-foreground">Reference: </span>
                <strong>{bankDetails.reference}</strong>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "سيتم تفعيل اشتراكك بعد تأكيد التحويل."
                : "Your subscription will be activated once we confirm the transfer."}
            </p>
            <Link href={`/${locale}/subscription`}>
              <Button variant="outline" className="mt-2">
                {locale === "ar" ? "حسناً" : "Done"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Link
        href={`/${locale}/pricing`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "العودة إلى الأسعار" : "Back to pricing"}
      </Link>

      <h1 className="font-heading text-2xl md:text-3xl font-bold">
        {t("checkout")}
      </h1>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Payment methods + promo */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">
                {locale === "ar" ? "طريقة الدفع" : "Payment method"}
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                {
                  id: "stripe" as const,
                  label: t("payWithCard"),
                  icon: CreditCard,
                  hint:
                    locale === "ar"
                      ? "Visa · Mastercard · Amex"
                      : "Visa · Mastercard · Amex",
                },
                {
                  id: "paytabs" as const,
                  label: t("payWithPayTabs"),
                  icon: CreditCard,
                  hint:
                    locale === "ar"
                      ? "بطاقات الخليج"
                      : "GCC payment methods",
                },
                {
                  id: "bank_transfer" as const,
                  label: t("bankTransfer"),
                  icon: Building2,
                  hint:
                    locale === "ar"
                      ? "تأكيد يدوي خلال يوم عمل"
                      : "Manual confirmation within 1 business day",
                },
              ] as const).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-4 transition-colors text-start ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <method.icon className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.hint}
                    </p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Promo */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("promoCode")}
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoApplied(false);
                      setPromoError("");
                    }}
                    className="ps-9"
                    disabled={promoApplied}
                  />
                </div>
                {promoApplied ? (
                  <Button variant="outline" disabled>
                    <CheckCircle className="h-4 w-4 me-1 text-success" />
                    {locale === "ar" ? "مُطبق" : "Applied"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={!promoCode}
                  >
                    {t("applyCode")}
                  </Button>
                )}
              </div>
              {promoError && (
                <p className="mt-2 text-sm text-destructive">{promoError}</p>
              )}
              {promoApplied && (
                <p className="mt-2 text-sm text-success">
                  {locale === "ar" ? "تم تطبيق الكود!" : "Code applied!"}
                </p>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg">{planName}</h3>
                {plan.metadata?.is_popular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                    <Sparkles className="h-3 w-3" />
                    {locale === "ar" ? "الأكثر شعبية" : "Popular"}
                  </span>
                )}
              </div>
              {planDesc && (
                <p className="text-sm text-muted-foreground">{planDesc}</p>
              )}

              {features?.length > 0 && (
                <>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    {features.slice(0, 6).map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0 text-success mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("subtotal")}
                  </span>
                  <span>
                    {formatCurrency(
                      Number(plan.price),
                      plan.currency,
                      locale
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{t("discount")}</span>
                    <span>
                      -{formatCurrency(discount, plan.currency, locale)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-base font-semibold">
                <span>{t("total")}</span>
                <span>
                  {formatCurrency(finalPrice, plan.currency, locale)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {period}
                  </span>
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing
                  ? locale === "ar"
                    ? "جارٍ المعالجة..."
                    : "Processing..."
                  : selectedMethod === "bank_transfer"
                  ? locale === "ar"
                    ? "احصل على تفاصيل الحساب"
                    : "Get bank details"
                  : locale === "ar"
                  ? "متابعة إلى الدفع"
                  : "Proceed to payment"}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                {locale === "ar"
                  ? "بالمتابعة، فإنك توافق على شروط الخدمة وسياسة الخصوصية."
                  : "By continuing, you agree to our Terms of Service and Privacy Policy."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
