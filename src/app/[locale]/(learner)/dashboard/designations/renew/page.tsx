"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { RefreshCw, Shield, CheckCircle2, AlertTriangle, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface RenewalData {
  holderId: string;
  status: string;
  memberNumber: string;
  currentPeriodEnd: string | null;
  tierName: string;
  tierSlug: string;
  designationName: string;
  abbreviation: string;
  renewalFee: number;
  lateFee: number;
  currency: string;
  isGracePeriod: boolean;
  totalDue: number;
}

export default function RenewalPage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [renewalData, setRenewalData] = useState<RenewalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRenewalInfo() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase
        .from("designation_holders")
        .select(
          `
          id,
          status,
          member_number,
          current_period_end,
          tier:designation_tiers!designation_holders_tier_id_fkey(
            name, name_ar, slug
          ),
          designation:designations!designation_holders_designation_id_fkey(
            name, name_ar, abbreviation, renewal_fee, founding_fee, late_fee, currency
          )
        `
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        const holder = data as unknown as {
          id: string;
          status: string;
          member_number: string;
          current_period_end: string | null;
          tier: { name: string; name_ar: string | null; slug: string }[];
          designation: { name: string; name_ar: string | null; abbreviation: string; renewal_fee: number; founding_fee: number; late_fee: number; currency: string }[];
        };
        const tier = holder.tier?.[0];
        const designation = holder.designation?.[0];
        const isGrace = holder.status === "grace_period";
        const isFounding = tier?.slug === "founding-member";
        const baseFee = isFounding
          ? (designation?.founding_fee ?? 50)
          : (designation?.renewal_fee ?? 70);
        const lateFee = isGrace ? (designation?.late_fee ?? 30) : 0;

        setRenewalData({
          holderId: holder.id,
          status: holder.status,
          memberNumber: holder.member_number,
          currentPeriodEnd: holder.current_period_end,
          tierName: locale === "ar" && tier?.name_ar ? tier.name_ar : tier?.name,
          tierSlug: tier?.slug,
          designationName: locale === "ar" && designation?.name_ar ? designation.name_ar : designation?.name,
          abbreviation: designation?.abbreviation,
          renewalFee: baseFee,
          lateFee,
          currency: designation?.currency ?? "USD",
          isGracePeriod: isGrace,
          totalDue: baseFee + lateFee,
        });
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchRenewalInfo();
  }, [user, authLoading, locale]);

  async function handleRenew() {
    if (!renewalData) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/designations/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holderId: renewalData.holderId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!renewalData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-xl font-semibold">
          {locale === "ar" ? "لا يمكن التجديد" : "Cannot Renew"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "لم يتم العثور على شهادة نشطة مرتبطة بحسابك."
            : "No active designation found for your account."}
        </p>
      </div>
    );
  }

  const alreadyRenewed = renewalData.status === "active" && renewalData.currentPeriodEnd &&
    new Date(renewalData.currentPeriodEnd).getTime() > Date.now() + (180 * 24 * 60 * 60 * 1000);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back Link */}
      <Link href={`/${locale}/dashboard/designations`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Link>

      <h1 className="font-heading text-2xl font-bold">
        {locale === "ar" ? "تجديد الشهادة" : "Renew Your Designation"}
      </h1>

      {/* Grace Period Warning */}
      {renewalData.isGracePeriod && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {locale === "ar" ? "فترة السماح" : "Grace Period"}
              </p>
              <p className="text-sm text-amber-800/70 mt-1">
                {locale === "ar"
                  ? "تجاوزت موعد التجديد. تم إضافة رسوم تأخير إلى المبلغ المستحق."
                  : "Your renewal deadline has passed. A late fee has been added to the amount due."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renewal Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "ar" ? "ملخص التجديد" : "Renewal Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "الشهادة" : "Designation"}
              </span>
              <span className="font-medium">{renewalData.abbreviation}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "المستوى" : "Tier"}
              </span>
              <span className="font-medium">{renewalData.tierName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "رقم العضوية" : "Member Number"}
              </span>
              <span className="font-mono font-medium">{renewalData.memberNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "فترة التجديد" : "Renewal Period"}
              </span>
              <span className="font-medium">
                {locale === "ar" ? "يوليو 2026 – يونيو 2027" : "Jul 2026 – Jun 2027"}
              </span>
            </div>

            <hr className="my-2" />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "رسوم التجديد" : "Renewal Fee"}
              </span>
              <span className="font-medium">
                ${renewalData.renewalFee.toFixed(2)} {renewalData.currency}
              </span>
            </div>

            {renewalData.lateFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">
                  {locale === "ar" ? "رسوم التأخير" : "Late Fee"}
                </span>
                <span className="font-medium text-amber-600">
                  +${renewalData.lateFee.toFixed(2)} {renewalData.currency}
                </span>
              </div>
            )}

            <hr className="my-2" />

            <div className="flex justify-between">
              <span className="font-semibold">
                {locale === "ar" ? "المجموع" : "Total"}
              </span>
              <span className="text-xl font-bold text-brand-600">
                ${renewalData.totalDue.toFixed(2)} {renewalData.currency}
              </span>
            </div>
          </div>

          {/* What You Get */}
          <div className="rounded-lg bg-muted/50 p-4 mt-4">
            <p className="text-sm font-semibold mb-2">
              {locale === "ar" ? "ما ستحصل عليه:" : "What you get:"}
            </p>
            <ul className="space-y-1.5">
              {[
                locale === "ar" ? "12 شهراً إضافية من الشهادة النشطة" : "12 more months of active certification",
                locale === "ar" ? "وصول إلى بوابة التعلم الإلكتروني" : "Access to the e-Learning Portal",
                locale === "ar" ? "الإدراج في السجل العام" : "Public registry listing",
                locale === "ar" ? "وصول إلى DIBoK الرقمي" : "Digital DIBoK access",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action */}
          <Button
            onClick={handleRenew}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">
                  {locale === "ar" ? "جاري المعالجة..." : "Processing..."}
                </span>
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {locale === "ar"
                  ? `ادفع $${renewalData.totalDue.toFixed(2)} الآن`
                  : `Pay $${renewalData.totalDue.toFixed(2)} Now`}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {locale === "ar"
              ? "سيتم توجيهك إلى Stripe لإتمام الدفع بشكل آمن."
              : "You'll be redirected to Stripe to complete payment securely."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
