"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CreditCard,
  Building2,
  ChevronLeft,
  Tag,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Course } from "@/types";

type PaymentMethodType = "stripe" | "paytabs" | "bank_transfer";

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const t = useTranslations("payments");

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState<Record<string, string> | null>(
    null
  );

  useEffect(() => {
    async function fetchCourse() {
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setCourse(data as Course);
        setFinalPrice(Number(data.price));
      }
      setIsLoading(false);
    }

    if (slug) fetchCourse();
  }, [slug]);

  const handleApplyPromo = async () => {
    if (!promoCode || !course) return;
    setPromoError("");

    const res = await fetch("/api/payments/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, courseId: course.id }),
    });

    const { data } = await res.json();
    if (data?.valid) {
      setPromoApplied(true);
      setDiscount(data.discountAmount);
      setFinalPrice(data.finalPrice);
    } else {
      setPromoError(data?.reason ?? t("invalidCode"));
    }
  };

  const handleCheckout = async () => {
    if (!course) return;
    setIsProcessing(true);

    try {
      if (selectedMethod === "bank_transfer") {
        const res = await fetch("/api/payments/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            promoCode: promoApplied ? promoCode : undefined,
          }),
        });
        const { data, error } = await res.json();
        if (error) {
          alert(error);
          return;
        }
        setBankDetails(data.bankDetails);
      } else {
        const endpoint =
          selectedMethod === "stripe"
            ? "/api/payments/checkout"
            : "/api/payments/paytabs";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            promoCode: promoApplied ? promoCode : undefined,
          }),
        });
        const { data, error } = await res.json();
        if (error) {
          alert(error);
          return;
        }
        if (data?.url) {
          window.location.href = data.url;
        }
      }
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

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const courseTitle =
    locale === "ar" && course.title_ar ? course.title_ar : course.title;

  // Bank transfer confirmed
  if (bankDetails) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <Building2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold">{t("bankTransfer")}</h2>
            <p className="text-sm text-muted-foreground">
              Please transfer{" "}
              <strong>
                {formatCurrency(finalPrice, course.currency, locale)}
              </strong>{" "}
              to the following account:
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
              Your enrollment will be activated once we confirm the transfer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <Link
        href={`/${locale}/courses/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        Back to Course
      </Link>

      <h1 className="font-heading text-2xl font-bold">{t("checkout")}</h1>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Payment methods */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Payment Method</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  {
                    id: "stripe" as const,
                    label: t("payWithCard"),
                    icon: CreditCard,
                  },
                  {
                    id: "paytabs" as const,
                    label: t("payWithPayTabs"),
                    icon: CreditCard,
                  },
                  {
                    id: "bank_transfer" as const,
                    label: t("bankTransfer"),
                    icon: Building2,
                  },
                ] as const
              ).map((method) => (
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
                  <span>{method.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Promo code */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    <CheckCircle className="h-4 w-4 me-1 text-green-500" />
                    Applied
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
                <p className="mt-1 text-sm text-destructive">{promoError}</p>
              )}
              {promoApplied && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  {t("codeApplied")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">{courseTitle}</h3>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span>
                    {formatCurrency(
                      Number(course.price),
                      course.currency,
                      locale
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>{t("discount")}</span>
                    <span>
                      -{formatCurrency(discount, course.currency, locale)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>{t("total")}</span>
                <span>
                  {formatCurrency(finalPrice, course.currency, locale)}
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing..."
                  : selectedMethod === "bank_transfer"
                    ? "Get Bank Details"
                    : "Proceed to Payment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
