"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Award,
  Star,
  Clock,
  FileText,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  BarChart3,
  Video,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface HolderDataRaw {
  id: string;
  status: string;
  member_number: string;
  certified_at: string;
  current_period_start: string;
  current_period_end: string;
  cpe_hours_completed: number;
  last_renewed_at: string | null;
  tier: {
    name: string;
    name_ar: string | null;
    slug: string;
    badge_url: string | null;
  }[];
  designation: {
    name: string;
    name_ar: string | null;
    abbreviation: string;
    annual_cpe_required: number;
    renewal_fee: number;
    late_fee: number;
    currency: string;
  }[];
}

interface HolderData extends Omit<HolderDataRaw, 'tier' | 'designation'> {
  tier: HolderDataRaw['tier'][number] | null;
  designation: HolderDataRaw['designation'][number] | null;
}

interface CPESubmission {
  id: string;
  title: string;
  title_ar: string | null;
  hours_claimed: number;
  hours_approved: number | null;
  status: string;
  activity_date: string;
  auto_credited: boolean;
  category: {
    name: string;
    name_ar: string | null;
  } | null;
}

interface UpcomingWebinar {
  id: string;
  title: string;
  title_ar: string | null;
  scheduled_at: string;
  cpe_hours: number;
}

export default function DesignationDashboardPage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [holder, setHolder] = useState<HolderData | null>(null);
  const [recentCPE, setRecentCPE] = useState<CPESubmission[]>([]);
  const [upcomingWebinars, setUpcomingWebinars] = useState<UpcomingWebinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch holder record
      const { data: holderData } = await supabase
        .from("designation_holders")
        .select(
          `
          id,
          status,
          member_number,
          certified_at,
          current_period_start,
          current_period_end,
          cpe_hours_completed,
          last_renewed_at,
          tier:designation_tiers!designation_holders_tier_id_fkey(
            name, name_ar, slug, badge_url
          ),
          designation:designations!designation_holders_designation_id_fkey(
            name, name_ar, abbreviation, annual_cpe_required, renewal_fee, late_fee, currency
          )
        `
        )
        .eq("user_id", user.id)
        .single();

      if (holderData) {
        const raw = holderData as unknown as HolderDataRaw;
        const h: HolderData = {
          ...raw,
          tier: raw.tier?.[0] ?? null,
          designation: raw.designation?.[0] ?? null,
        };
        setHolder(h);

        // Fetch recent CPE submissions
        const { data: cpeData } = await supabase
          .from("cpe_submissions")
          .select(
            `
            id,
            title,
            title_ar,
            hours_claimed,
            hours_approved,
            status,
            activity_date,
            auto_credited,
            category:cpe_categories!cpe_submissions_cpe_category_id_fkey(
              name, name_ar
            )
          `
          )
          .eq("holder_id", h.id)
          .order("activity_date", { ascending: false })
          .limit(5);

        setRecentCPE((cpeData ?? []) as unknown as CPESubmission[]);

        // Fetch upcoming CPE-eligible webinars
        const { data: webinarData } = await supabase
          .from("webinars")
          .select("id, title, title_ar, scheduled_at, cpe_hours")
          .gt("cpe_hours", 0)
          .gte("scheduled_at", new Date().toISOString())
          .in("status", ["scheduled", "live"])
          .order("scheduled_at", { ascending: true })
          .limit(3);

        setUpcomingWebinars((webinarData ?? []) as unknown as UpcomingWebinar[]);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchDashboard();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!holder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Award className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-xl font-semibold">
          {locale === "ar" ? "لا توجد شهادة" : "No Designation Found"}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {locale === "ar"
            ? "لم يتم العثور على شهادة مرتبطة بحسابك. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع VIFM."
            : "No designation is associated with your account. If you believe this is an error, please contact VIFM."}
        </p>
        <Link href={`/${locale}/designations`}>
          <Button className="mt-6">
            {locale === "ar" ? "تصفح الشهادات المهنية" : "Browse Designations"}
          </Button>
        </Link>
      </div>
    );
  }

  const isFoundingMember = holder.tier?.slug === "founding-member";
  const cpeRequired = holder.designation?.annual_cpe_required ?? 20;
  const cpeCompleted = holder.cpe_hours_completed;
  const cpePercentage = Math.min(Math.round((cpeCompleted / cpeRequired) * 100), 100);
  const cpeRemaining = Math.max(cpeRequired - cpeCompleted, 0);

  const periodEnd = holder.current_period_end ? new Date(holder.current_period_end) : null;
  const daysUntilRenewal = periodEnd
    ? Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isGracePeriod = holder.status === "grace_period";
  const isActive = holder.status === "active";

  const tierName =
    locale === "ar" && holder.tier?.name_ar ? holder.tier.name_ar : holder.tier?.name;
  const designationName =
    locale === "ar" && holder.designation?.name_ar
      ? holder.designation.name_ar
      : holder.designation?.name;

  const statusConfig = {
    active: { icon: CheckCircle2, label: locale === "ar" ? "نشط" : "Active", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    grace_period: { icon: AlertTriangle, label: locale === "ar" ? "فترة سماح" : "Grace Period", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    suspended: { icon: XCircle, label: locale === "ar" ? "معلق" : "Suspended", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    lapsed: { icon: XCircle, label: locale === "ar" ? "منتهي" : "Lapsed", color: "text-muted-foreground", bg: "bg-muted", border: "border-muted" },
    revoked: { icon: XCircle, label: locale === "ar" ? "ملغى" : "Revoked", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
  };

  const currentStatus = statusConfig[holder.status as keyof typeof statusConfig] ?? statusConfig.active;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {locale === "ar" ? "لوحة تحكم الشهادة" : "Designation Dashboard"}
      </h1>

      {/* ── Renewal Banner ── */}
      {(isGracePeriod || (daysUntilRenewal !== null && daysUntilRenewal <= 90 && isActive)) && (
        <Card className={`border-2 ${isGracePeriod ? "border-amber-300 bg-amber-50" : "border-brand-200 bg-brand-50"}`}>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isGracePeriod ? "bg-amber-100" : "bg-brand-100"}`}>
              {isGracePeriod ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <Clock className="h-5 w-5 text-brand-600" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className={`font-semibold ${isGracePeriod ? "text-amber-900" : "text-brand-900"}`}>
                {isGracePeriod
                  ? locale === "ar"
                    ? "أنت في فترة السماح — تطبق رسوم تأخير"
                    : "You are in the grace period — late fee applies"
                  : locale === "ar"
                    ? `${daysUntilRenewal} يوم حتى موعد التجديد`
                    : `${daysUntilRenewal} days until renewal deadline`}
              </p>
              <p className={`text-sm ${isGracePeriod ? "text-amber-800/70" : "text-brand-800/70"}`}>
                {isGracePeriod
                  ? locale === "ar"
                    ? `المبلغ المستحق: $${(holder.designation?.renewal_fee ?? 70) + (holder.designation?.late_fee ?? 30)} ${holder.designation?.currency ?? "USD"}`
                    : `Amount due: $${(holder.designation?.renewal_fee ?? 70) + (holder.designation?.late_fee ?? 30)} ${holder.designation?.currency ?? "USD"}`
                  : locale === "ar"
                    ? `المبلغ المستحق: $${holder.designation?.renewal_fee ?? 70} ${holder.designation?.currency ?? "USD"}`
                    : `Amount due: $${holder.designation?.renewal_fee ?? 70} ${holder.designation?.currency ?? "USD"}`}
              </p>
            </div>
            <Link href={`/${locale}/dashboard/designations/renew`}>
              <Button className={isGracePeriod ? "bg-amber-600 hover:bg-amber-700" : ""}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {locale === "ar" ? "جدد الآن" : "Renew Now"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Status Card ── */}
      <Card className={`border-2 ${currentStatus.border}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${isFoundingMember ? "bg-amber-100" : "bg-brand-50"}`}>
              <Award className={`h-10 w-10 ${isFoundingMember ? "text-amber-600" : "text-brand-600"}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">{designationName}</h2>
              <p className="text-sm text-muted-foreground font-mono mt-1">{holder.member_number}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isFoundingMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Star className="h-3 w-3" />
                    {tierName}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.bg} ${currentStatus.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {currentStatus.label}
                </span>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "معتمد منذ" : "Certified Since"}
              </p>
              <p className="font-semibold">
                {formatDate(holder.certified_at, locale)}
              </p>
              {periodEnd && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">
                    {locale === "ar" ? "التجديد القادم" : "Next Renewal"}
                  </p>
                  <p className="font-semibold">
                    {formatDate(holder.current_period_end, locale)}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CPE Progress ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CPE Ring */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {locale === "ar" ? "تقدم CPE" : "CPE Progress"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="relative mx-auto h-36 w-36">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray={`${(cpePercentage / 100) * 327} 327`}
                  strokeLinecap="round"
                  className={cpePercentage >= 100 ? "stroke-success" : cpePercentage >= 50 ? "stroke-amber-500" : "stroke-destructive"}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{cpeCompleted}</span>
                <span className="text-xs text-muted-foreground">
                  {locale === "ar" ? `من ${cpeRequired}` : `of ${cpeRequired}`}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {cpeRemaining > 0
                ? locale === "ar"
                  ? `${cpeRemaining} ساعة متبقية`
                  : `${cpeRemaining} hours remaining`
                : locale === "ar"
                  ? "مكتمل!"
                  : "Complete!"}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={`/${locale}/dashboard/designations/cpe`}>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Plus className="mr-3 h-5 w-5 text-brand-600" />
                  <div className="text-left">
                    <p className="font-medium">{locale === "ar" ? "تسجيل ساعات CPE" : "Log CPE Hours"}</p>
                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "أضف نشاطاً جديداً" : "Submit a new activity"}</p>
                  </div>
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/designations/documents`}>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Download className="mr-3 h-5 w-5 text-brand-600" />
                  <div className="text-left">
                    <p className="font-medium">{locale === "ar" ? "تنزيل DIBoK" : "Download DIBoK"}</p>
                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "7 وثائق PDF" : "7 PDF documents"}</p>
                  </div>
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/designations/certificate`}>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Award className="mr-3 h-5 w-5 text-brand-600" />
                  <div className="text-left">
                    <p className="font-medium">{locale === "ar" ? "شهادتي" : "My Certificate"}</p>
                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "تنزيل أو مشاركة" : "Download or share"}</p>
                  </div>
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/designations/profile`}>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <ExternalLink className="mr-3 h-5 w-5 text-brand-600" />
                  <div className="text-left">
                    <p className="font-medium">{locale === "ar" ? "ملف السجل" : "Registry Profile"}</p>
                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "إدارة ظهورك العام" : "Manage your public listing"}</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent CPE Activity ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {locale === "ar" ? "نشاط CPE الأخير" : "Recent CPE Activity"}
          </CardTitle>
          <Link href={`/${locale}/dashboard/designations/cpe`}>
            <Button variant="outline" size="sm">
              {locale === "ar" ? "عرض الكل" : "View All"}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentCPE.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                {locale === "ar" ? "لا توجد أنشطة CPE بعد" : "No CPE activities yet"}
              </p>
              <Link href={`/${locale}/dashboard/designations/cpe`}>
                <Button className="mt-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {locale === "ar" ? "سجل أول نشاط" : "Log Your First Activity"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCPE.map((submission) => {
                const title =
                  locale === "ar" && submission.title_ar ? submission.title_ar : submission.title;
                const catName =
                  locale === "ar" && submission.category?.name_ar
                    ? submission.category.name_ar
                    : submission.category?.name;

                const statusStyles = {
                  approved: { label: locale === "ar" ? "معتمد" : "Approved", color: "text-success bg-success/10" },
                  pending: { label: locale === "ar" ? "قيد المراجعة" : "Pending", color: "text-amber-600 bg-amber-50" },
                  rejected: { label: locale === "ar" ? "مرفوض" : "Rejected", color: "text-destructive bg-destructive/10" },
                };

                const sStatus = statusStyles[submission.status as keyof typeof statusStyles] ?? statusStyles.pending;

                return (
                  <div key={submission.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-sm">{title}</p>
                        {submission.auto_credited && (
                          <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                            {locale === "ar" ? "تلقائي" : "Auto"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {catName} · {formatDate(submission.activity_date, locale)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {submission.hours_approved ?? submission.hours_claimed}{" "}
                        {locale === "ar" ? "ساعات" : "hrs"}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${sStatus.color}`}>
                        {sStatus.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Upcoming CPE Opportunities ── */}
      {upcomingWebinars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5" />
              {locale === "ar" ? "فرص CPE القادمة" : "Upcoming CPE Opportunities"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingWebinars.map((webinar) => {
                const wTitle =
                  locale === "ar" && webinar.title_ar ? webinar.title_ar : webinar.title;
                return (
                  <Link
                    key={webinar.id}
                    href={`/${locale}/webinars/${webinar.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10">
                      <Video className="h-5 w-5 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{wTitle}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(webinar.scheduled_at, locale)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      +{webinar.cpe_hours} CPE
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
