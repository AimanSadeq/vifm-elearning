"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  ArrowLeft,
  Calendar,
  Building2,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface VerificationData {
  fullName: string;
  memberNumber: string;
  certifiedAt: string;
  status: string;
  company: string | null;
  jobTitle: string | null;
  tierName: string;
  tierSlug: string;
  designationName: string;
  abbreviation: string;
  designationSlug: string;
}

export default function DesignationVerifyPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const memberNumber = params.memberNumber as string;

  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function verify() {
      const supabase = createClient();

      // First get the designation to filter by
      const { data: desig } = await supabase
        .from("designations")
        .select("id, name, name_ar, abbreviation, slug")
        .eq("slug", slug)
        .single();

      if (!desig) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: holder } = await supabase
        .from("designation_holders")
        .select(
          `
          member_number,
          certified_at,
          status,
          registry_company,
          registry_company_ar,
          registry_title,
          registry_title_ar,
          show_in_registry,
          tier:designation_tiers!designation_holders_tier_id_fkey(
            name, name_ar, slug
          ),
          designation:designations!designation_holders_designation_id_fkey(
            name, name_ar, abbreviation, slug
          ),
          profile:profiles!designation_holders_user_id_fkey(
            full_name
          )
        `
        )
        .eq("member_number", memberNumber)
        .eq("designation_id", desig.id)
        .single();

      if (!holder) {
        setNotFound(true);
      } else {
        const h = holder as any;
        setData({
          fullName: h.profile?.full_name ?? "—",
          memberNumber: h.member_number,
          certifiedAt: h.certified_at,
          status: h.status,
          company: locale === "ar" && h.registry_company_ar ? h.registry_company_ar : h.registry_company,
          jobTitle: locale === "ar" && h.registry_title_ar ? h.registry_title_ar : h.registry_title,
          tierName: locale === "ar" && h.tier?.name_ar ? h.tier.name_ar : h.tier?.name,
          tierSlug: h.tier?.slug,
          designationName: locale === "ar" && h.designation?.name_ar ? h.designation.name_ar : h.designation?.name,
          abbreviation: h.designation?.abbreviation,
          designationSlug: h.designation?.slug,
        });
      }

      setIsLoading(false);
    }

    verify();
  }, [slug, memberNumber, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <XCircle className="h-16 w-16 text-destructive/50" />
        <h2 className="mt-4 text-xl font-semibold">
          {locale === "ar" ? "لم يتم العثور على الشهادة" : "Credential Not Found"}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {locale === "ar"
            ? `لم يتم العثور على أي شهادة مرتبطة برقم العضوية "${memberNumber}". تحقق من الرقم وحاول مرة أخرى.`
            : `No credential found for member number "${memberNumber}". Please verify the number and try again.`}
        </p>
        <Link href={`/${locale}/designations/${slug}/registry`}>
          <Button className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === "ar" ? "العودة إلى السجل" : "Back to Registry"}
          </Button>
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const isFoundingMember = data.tierSlug === "founding-member";

  const statusConfig = {
    active: {
      icon: CheckCircle2,
      label: locale === "ar" ? "نشط ومعتمد" : "Active & Verified",
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/30",
    },
    grace_period: {
      icon: AlertTriangle,
      label: locale === "ar" ? "فترة سماح" : "Grace Period",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    suspended: {
      icon: XCircle,
      label: locale === "ar" ? "معلق" : "Suspended",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
    lapsed: {
      icon: XCircle,
      label: locale === "ar" ? "منتهي" : "Lapsed",
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-muted",
    },
    revoked: {
      icon: XCircle,
      label: locale === "ar" ? "ملغى" : "Revoked",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  };

  const status = statusConfig[data.status as keyof typeof statusConfig] ?? statusConfig.suspended;
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16">
      <Link
        href={`/${locale}/designations/${slug}/registry`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى السجل" : "Back to Registry"}
      </Link>

      {/* Verification Card */}
      <Card className={`border-2 ${status.border} overflow-hidden`}>
        {/* Status Header */}
        <div className={`${status.bg} px-6 py-4 text-center`}>
          <StatusIcon className={`mx-auto h-10 w-10 ${status.color}`} />
          <p className={`mt-2 text-lg font-bold ${status.color}`}>{status.label}</p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Name & Designation */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">{data.fullName}</h2>
            <p className="mt-1 text-muted-foreground">{data.designationName}</p>
            {isFoundingMember && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <Star className="h-3 w-3" />
                {data.tierName}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {locale === "ar" ? "رقم العضوية" : "Member Number"}
              </span>
              <span className="font-mono font-semibold">{data.memberNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {locale === "ar" ? "تاريخ الاعتماد" : "Certified Since"}
              </span>
              <span className="font-semibold">{formatDate(data.certifiedAt, locale)}</span>
            </div>
            {data.company && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {locale === "ar" ? "الشركة" : "Company"}
                </span>
                <span className="font-semibold">{data.company}</span>
              </div>
            )}
            {data.jobTitle && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {locale === "ar" ? "المسمى الوظيفي" : "Job Title"}
                </span>
                <span className="font-semibold">{data.jobTitle}</span>
              </div>
            )}
          </div>

          {/* Issued By */}
          <div className="text-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "صادرة عن" : "Issued by"}
            </p>
            <p className="font-semibold text-sm mt-1">
              Virginia Institute of Finance and Management (VIFM)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
