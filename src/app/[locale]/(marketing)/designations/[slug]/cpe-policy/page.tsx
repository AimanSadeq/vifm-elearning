"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, Video, Globe, FileText, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface DesignationInfo {
  id: string;
  name: string;
  name_ar: string | null;
  abbreviation: string;
  slug: string;
  annual_cpe_required: number;
  renewal_month: number;
  renewal_day: number;
  grace_period_months: number;
  metadata: Record<string, unknown> | null;
}

interface CPECategory {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  annual_max_hours: number | null;
  requires_approval: boolean;
  sort_order: number;
}

const categoryIcons = [BookOpen, Video, Globe, FileText];
const categoryColors = [
  { color: "text-brand-600", bg: "bg-brand-50" },
  { color: "text-info", bg: "bg-info/10" },
  { color: "text-accent-600", bg: "bg-accent-50" },
  { color: "text-muted-foreground", bg: "bg-muted" },
];

export default function DesignationCPEPolicyPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [designation, setDesignation] = useState<DesignationInfo | null>(null);
  const [cpeCategories, setCpeCategories] = useState<CPECategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: desig } = await supabase
        .from("designations")
        .select("id, name, name_ar, abbreviation, slug, annual_cpe_required, renewal_month, renewal_day, grace_period_months, metadata")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!desig) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setDesignation(desig as DesignationInfo);

      const { data: cats } = await supabase
        .from("cpe_categories")
        .select("id, name, name_ar, description, annual_max_hours, requires_approval, sort_order")
        .eq("designation_id", desig.id)
        .order("sort_order");

      setCpeCategories((cats ?? []) as CPECategory[]);
      setIsLoading(false);
    }

    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound || !designation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold">
          {locale === "ar" ? "التسمية غير موجودة" : "Designation Not Found"}
        </h2>
      </div>
    );
  }

  const d = designation;
  const meta = d.metadata ?? {};
  const cycleYears = Number(meta.cpe_cycle_years) || 1;
  const cpeHours = Number(meta.cpe_cycle_hours) || d.annual_cpe_required * cycleYears;
  const cpeCycleYears = cycleYears;

  // Grace period end month
  const graceEndMonth = ((d.renewal_month - 1 + d.grace_period_months) % 12) + 1;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const renewalMonthLabel = locale === "ar" ? `${d.renewal_day} ${monthNamesAr[d.renewal_month - 1]}` : `${monthNames[d.renewal_month - 1]} ${d.renewal_day}`;
  const graceEndLabel = locale === "ar" ? `1 ${monthNamesAr[graceEndMonth - 1]}` : `${monthNames[graceEndMonth - 1]} 1`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <Link
        href={`/${locale}/designations/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? `العودة إلى ${d.abbreviation}` : `Back to ${d.abbreviation}`}
      </Link>

      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
          <Clock className="h-4 w-4" />
          {locale === "ar" ? "سياسة التعليم المهني المستمر" : "CPE Policy"}
        </div>
        <h1 className="font-heading text-3xl font-bold">
          {locale === "ar"
            ? "سياسة التعليم المهني المستمر (CPE)"
            : "Continuing Professional Education (CPE) Policy"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar"
            ? `شهادة ${d.abbreviation} — معهد فيرجينيا للتمويل والإدارة`
            : `${d.abbreviation} Designation — Virginia Institute of Finance and Management`}
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {locale === "ar" ? "نظرة عامة" : "Overview"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {locale === "ar"
              ? `يجب على جميع حاملي شهادة ${d.abbreviation} النشطين إكمال ${cpeHours} ساعة من التعليم المهني المستمر (CPE) كل ${cpeCycleYears} سنوات (دورة التجديد: ${renewalMonthLabel}) للحفاظ على شهادتهم النشطة. يضمن برنامج CPE أن يظل المحترفون المعتمدون على اطلاع بأحدث التطورات في مجال تخصصهم.`
              : `All active ${d.abbreviation} holders must complete ${cpeHours} hours of Continuing Professional Education (CPE) every ${cpeCycleYears} years (renewal cycle: ${renewalMonthLabel}) to maintain active certification. The CPE program ensures certified professionals stay current with evolving practices in their field.`}
          </p>
        </CardContent>
      </Card>

      {/* Categories */}
      {cpeCategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {locale === "ar" ? "فئات CPE المؤهلة" : "Eligible CPE Categories"}
          </h2>
          <div className="space-y-4">
            {cpeCategories.map((cat, i) => {
              const Icon = categoryIcons[i % categoryIcons.length];
              const palette = categoryColors[i % categoryColors.length];
              const catName = locale === "ar" && cat.name_ar ? cat.name_ar : cat.name;
              const limit = cat.annual_max_hours
                ? locale === "ar"
                  ? `بحد أقصى ${cat.annual_max_hours} ساعات/سنة`
                  : `Max ${cat.annual_max_hours} hours/year`
                : locale === "ar"
                ? "غير محدود"
                : "Unlimited";
              const rate = locale === "ar" ? "ساعة واحدة لكل ساعة موثقة" : "1 CPE hour per documented hour";
              const approval = cat.requires_approval
                ? locale === "ar"
                  ? "يتطلب مراجعة"
                  : "Requires review"
                : locale === "ar"
                ? "تلقائي"
                : "Auto-credited";

              return (
                <Card key={cat.id}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${palette.bg}`}>
                      <Icon className={`h-5 w-5 ${palette.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{catName}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>
                          {locale === "ar" ? "الحد:" : "Limit:"}{" "}
                          <strong className="text-foreground">{limit}</strong>
                        </span>
                        <span>
                          {locale === "ar" ? "المعدل:" : "Rate:"}{" "}
                          <strong className="text-foreground">{rate}</strong>
                        </span>
                        <span>
                          {locale === "ar" ? "الموافقة:" : "Approval:"}{" "}
                          <strong className="text-foreground">{approval}</strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Dates */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {locale === "ar" ? "التواريخ الرئيسية" : "Key Dates"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-brand-600">{renewalMonthLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "ar" ? "موعد التجديد" : "Renewal Deadline"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{graceEndLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "ar" ? "نهاية فترة السماح" : "Grace Period Ends"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-success">{cpeHours}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "ar"
                  ? `ساعات CPE / ${cpeCycleYears} سنوات`
                  : `CPE Hours / ${cpeCycleYears} Years`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Non-compliance */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {locale === "ar" ? "عدم الامتثال" : "Non-Compliance"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {locale === "ar"
              ? `قد يخضع حاملو ${d.abbreviation} الذين لا يكملون الحد الأدنى المطلوب من ساعات CPE بحلول نهاية دورة التجديد لتعليق شهادتهم. يمكن لـ VIFM منح تمديدات في ظروف استثنائية بناءً على طلب مكتوب.`
              : `${d.abbreviation} holders who fail to complete the minimum required CPE hours by the end of the renewal cycle may be subject to certification suspension. VIFM may grant extensions in exceptional circumstances upon written request.`}
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Link href={`/${locale}/designations/${slug}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === "ar" ? `العودة إلى صفحة ${d.abbreviation}` : `Back to ${d.abbreviation} Page`}
          </Button>
        </Link>
      </div>
    </div>
  );
}
