"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Award,
  Star,
  Download,
  Share2,
  Linkedin,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface CertificateData {
  fullName: string;
  memberNumber: string;
  certifiedAt: string;
  designationName: string;
  abbreviation: string;
  tierName: string;
  tierSlug: string;
  verifyUrl: string;
}

export default function CertificatePage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchCertificate() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase
        .from("designation_holders")
        .select(
          `
          member_number,
          certified_at,
          tier:designation_tiers!designation_holders_tier_id_fkey(
            name, name_ar, slug
          ),
          designation:designations!designation_holders_designation_id_fkey(
            name, name_ar, abbreviation
          ),
          profile:profiles!designation_holders_user_id_fkey(
            full_name
          )
        `
        )
        .eq("user_id", user.id)
        .in("status", ["active", "grace_period"])
        .single();

      if (data) {
        const h = data as any;
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

        setCertData({
          fullName: h.profile?.full_name ?? "",
          memberNumber: h.member_number,
          certifiedAt: h.certified_at,
          designationName:
            locale === "ar" && h.designation?.name_ar
              ? h.designation.name_ar
              : h.designation?.name,
          abbreviation: h.designation?.abbreviation,
          tierName:
            locale === "ar" && h.tier?.name_ar
              ? h.tier.name_ar
              : h.tier?.name,
          tierSlug: h.tier?.slug,
          verifyUrl: `${baseUrl}/${locale}/designations/cdip/verify/${h.member_number}`,
        });
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchCertificate();
  }, [user, authLoading, locale]);

  async function handleDownloadPDF() {
    if (!certData) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/designations/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: certData.fullName,
          memberNumber: certData.memberNumber,
          certifiedAt: certData.certifiedAt,
          designationName: certData.designationName,
          abbreviation: certData.abbreviation,
          tierName: certData.tierName,
          tierSlug: certData.tierSlug,
          verifyUrl: certData.verifyUrl,
          locale,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate certificate");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certData.abbreviation}_Certificate_${certData.memberNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Certificate generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleShareLinkedIn() {
    if (!certData) return;

    const linkedInUrl = new URL("https://www.linkedin.com/profile/add");
    linkedInUrl.searchParams.set("startTask", "CERTIFICATION_NAME");
    linkedInUrl.searchParams.set("name", `${certData.abbreviation} — ${certData.designationName}`);
    linkedInUrl.searchParams.set("organizationName", "Virginia Institute of Finance and Management (VIFM)");
    linkedInUrl.searchParams.set("certUrl", certData.verifyUrl);
    linkedInUrl.searchParams.set("certId", certData.memberNumber);

    if (certData.certifiedAt) {
      const date = new Date(certData.certifiedAt);
      linkedInUrl.searchParams.set("issueYear", date.getFullYear().toString());
      linkedInUrl.searchParams.set("issueMonth", (date.getMonth() + 1).toString());
    }

    window.open(linkedInUrl.toString(), "_blank");
  }

  async function handleCopyLink() {
    if (!certData) return;
    try {
      await navigator.clipboard.writeText(certData.verifyUrl);
    } catch {
      // Fallback for older browsers
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!certData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Award className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-xl font-semibold">
          {locale === "ar" ? "لا توجد شهادة نشطة" : "No Active Certificate"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "يجب أن تكون حاملاً نشطاً لـ CDIP لعرض شهادتك."
            : "You must be an active CDIP holder to view your certificate."}
        </p>
      </div>
    );
  }

  const isFoundingMember = certData.tierSlug === "founding-member";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/${locale}/dashboard/designations`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Link>

      <h1 className="font-heading text-2xl font-bold">
        {locale === "ar" ? "شهادتي" : "My Certificate"}
      </h1>

      {/* Certificate Preview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 text-white text-center relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white" />
            <div className="absolute -bottom-5 -left-5 h-24 w-24 rounded-full bg-white" />
          </div>
          <div className="relative">
            <Award className="mx-auto h-12 w-12" />
            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-white/70">
              {locale === "ar" ? "هذا يشهد بأن" : "This certifies that"}
            </p>
            <h2 className="mt-3 text-3xl font-bold">{certData.fullName}</h2>
            <p className="mt-4 text-lg text-white/90">
              {locale === "ar" ? "حاصل على تسمية" : "has earned the designation of"}
            </p>
            <p className="mt-2 text-2xl font-bold">{certData.designationName}</p>
            <p className="mt-1 text-lg font-semibold text-white/80">({certData.abbreviation})</p>

            {isFoundingMember && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-semibold text-amber-200">
                <Star className="h-4 w-4" />
                {certData.tierName}
              </div>
            )}

            <div className="mt-8 flex justify-center gap-12 text-sm">
              <div>
                <p className="text-white/60">
                  {locale === "ar" ? "تاريخ الاعتماد" : "Certified"}
                </p>
                <p className="font-semibold">{formatDate(certData.certifiedAt, locale)}</p>
              </div>
              <div>
                <p className="text-white/60">
                  {locale === "ar" ? "رقم العضوية" : "Member #"}
                </p>
                <p className="font-mono font-semibold">{certData.memberNumber}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/20 pt-4">
              <p className="text-xs text-white/50">
                Virginia Institute of Finance and Management (VIFM)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Button onClick={handleDownloadPDF} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {locale === "ar" ? "تنزيل PDF" : "Download PDF"}
        </Button>

        <Button variant="outline" onClick={handleShareLinkedIn} className="w-full">
          <Linkedin className="mr-2 h-4 w-4" />
          {locale === "ar" ? "أضف إلى LinkedIn" : "Add to LinkedIn"}
        </Button>

        <Button variant="outline" onClick={handleCopyLink} className="w-full">
          <Share2 className="mr-2 h-4 w-4" />
          {locale === "ar" ? "نسخ رابط التحقق" : "Copy Verify Link"}
        </Button>
      </div>

      {/* Verification URL */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "رابط التحقق العام" : "Public Verification URL"}
              </p>
              <p className="text-sm font-mono truncate text-brand-600 mt-0.5">
                {certData.verifyUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
