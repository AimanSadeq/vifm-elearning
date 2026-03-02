"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { DesignationResource } from "@/types";

import { DesignationHero } from "@/components/designation/DesignationHero";
import { DesignationTabs } from "@/components/designation/DesignationTabs";
import { DesignationOverview } from "@/components/designation/DesignationOverview";
import { DesignationModules } from "@/components/designation/DesignationModules";
import { DesignationFoundingMember } from "@/components/designation/DesignationFoundingMember";
import { DesignationSteps } from "@/components/designation/DesignationSteps";
import { DesignationCPE } from "@/components/designation/DesignationCPE";
import { DesignationResources } from "@/components/designation/DesignationResources";
import { DesignationFAQ } from "@/components/designation/DesignationFAQ";
import { DesignationCTA } from "@/components/designation/DesignationCTA";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DesignationData {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  abbreviation: string;
  description: string | null;
  description_ar: string | null;
  founding_fee: number;
  renewal_fee: number;
  late_fee: number;
  annual_cpe_required: number;
  renewal_month: number;
  renewal_day: number;
  grace_period_months: number;
  metadata: Record<string, unknown> | null;
}

interface DesignationDocument {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  sort_order: number;
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

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: build FAQ from designation data                            */
/* ------------------------------------------------------------------ */

function buildFAQ(d: DesignationData, cpeCategories: CPECategory[]): FAQItem[] {
  const meta = d.metadata ?? {};
  const examType = meta.exam_type === "simulation" ? "simulation-based" : "multiple-choice";
  const examTypeAr = meta.exam_type === "simulation" ? "قائم على المحاكاة" : "اختيار من متعدد";
  const passRate = Number(meta.pass_rate) || 65;
  const freeAttempts = Number(meta.free_attempts) || 2;
  const prerequisites: string[] = Array.isArray(meta.prerequisites) ? meta.prerequisites : [];
  const cycleYears = Number(meta.cpe_cycle_years) || 1;
  const cpeHours = Number(meta.cpe_cycle_hours) || d.annual_cpe_required * cycleYears;

  const faqs: FAQItem[] = [
    {
      question: `What is the ${d.abbreviation} certification?`,
      questionAr: `ما هي شهادة ${d.abbreviation}؟`,
      answer: `The ${d.name} (${d.abbreviation}) is a professional designation issued by the Virginia Institute of Finance and Management (VIFM). ${d.description ?? ""}`,
      answerAr: `${d.name_ar ?? d.name} (${d.abbreviation}) هي تسمية مهنية صادرة عن معهد فيرجينيا للتمويل والإدارة (VIFM). ${d.description_ar ?? ""}`,
    },
    {
      question: "What is the exam format?",
      questionAr: "ما هو شكل الامتحان؟",
      answer: `The ${d.abbreviation} exam is ${examType} with a ${passRate}% pass rate. You get ${freeAttempts} free attempts included with enrollment.`,
      answerAr: `امتحان ${d.abbreviation} هو ${examTypeAr} بمعدل نجاح ${passRate}%. تحصل على ${freeAttempts} محاولات مجانية مع التسجيل.`,
    },
    {
      question: "How much does renewal cost?",
      questionAr: "كم تكلفة التجديد؟",
      answer: `Annual renewal is $${d.renewal_fee} USD for Standard members. Founding Members receive a discounted first-year renewal of $${d.founding_fee} USD. A $${d.late_fee} late fee applies if renewal occurs during the ${d.grace_period_months}-month grace period after the July ${d.renewal_day} deadline.`,
      answerAr: `التجديد السنوي هو ${d.renewal_fee} دولاراً للأعضاء العاديين. يحصل الأعضاء المؤسسون على تجديد مخفض للسنة الأولى بقيمة ${d.founding_fee} دولاراً. يتم تطبيق رسوم تأخير بقيمة ${d.late_fee} دولاراً إذا تم التجديد خلال فترة السماح البالغة ${d.grace_period_months} أشهر.`,
    },
    {
      question: "What are the CPE requirements?",
      questionAr: "ما هي متطلبات CPE؟",
      answer: `${d.abbreviation} holders must complete ${cpeHours} hours of Continuing Professional Education (CPE) every ${cycleYears} years. Eligible activities include ${cpeCategories.map((c) => c.name).join(", ")}.`,
      answerAr: `يجب على حاملي ${d.abbreviation} إكمال ${cpeHours} ساعة من التعليم المهني المستمر (CPE) كل ${cycleYears} سنوات. تشمل الأنشطة المؤهلة ${cpeCategories.map((c) => c.name_ar ?? c.name).join("، ")}.`,
    },
    {
      question: "What happens if I don't renew on time?",
      questionAr: "ماذا يحدث إذا لم أجدد في الوقت المحدد؟",
      answer: `After the July ${d.renewal_day} deadline, you enter a ${d.grace_period_months}-month grace period where you can still renew with a $${d.late_fee} late fee. If you don't renew by the end of the grace period, your certification is suspended.`,
      answerAr: `بعد الموعد النهائي في 1 يوليو، تدخل فترة سماح مدتها ${d.grace_period_months} أشهر حيث يمكنك التجديد مع رسوم تأخير بقيمة ${d.late_fee} دولاراً. إذا لم تجدد، يتم تعليق شهادتك.`,
    },
  ];

  if (prerequisites.length > 0) {
    faqs.push({
      question: "Are there prerequisites?",
      questionAr: "هل هناك متطلبات مسبقة؟",
      answer: `Yes, the ${d.abbreviation} requires one of the following: ${prerequisites.join(" or ")}. You must hold an active certification in at least one prerequisite designation.`,
      answerAr: `نعم، يتطلب ${d.abbreviation} واحدة من التالي: ${prerequisites.join(" أو ")}. يجب أن تحمل شهادة نشطة في تسمية واحدة على الأقل.`,
    });
  }

  return faqs;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignationLandingPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [designation, setDesignation] = useState<DesignationData | null>(null);
  const [documents, setDocuments] = useState<DesignationDocument[]>([]);
  const [cpeCategories, setCpeCategories] = useState<CPECategory[]>([]);
  const [resources, setResources] = useState<DesignationResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "courseWebsite">("overview");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch designation
      const { data: desig } = await supabase
        .from("designations")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!desig) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setDesignation(desig as DesignationData);

      // Fetch documents, CPE categories, and resources in parallel
      const [docsRes, catsRes, resourcesRes] = await Promise.all([
        supabase
          .from("designation_documents")
          .select("id, title, title_ar, description, sort_order")
          .eq("designation_id", desig.id)
          .order("sort_order"),
        supabase
          .from("cpe_categories")
          .select("id, name, name_ar, description, annual_max_hours, requires_approval, sort_order")
          .eq("designation_id", desig.id)
          .order("sort_order"),
        supabase
          .from("designation_resources")
          .select("*")
          .eq("designation_id", desig.id)
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      setDocuments((docsRes.data ?? []) as DesignationDocument[]);
      setCpeCategories((catsRes.data ?? []) as CPECategory[]);
      setResources((resourcesRes.data ?? []) as DesignationResource[]);
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
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "لم يتم العثور على هذه التسمية المهنية."
            : "This professional designation could not be found."}
        </p>
      </div>
    );
  }

  const d = designation;
  const meta = d.metadata ?? {};
  const name = locale === "ar" && d.name_ar ? d.name_ar : d.name;
  const desc = locale === "ar" && d.description_ar ? d.description_ar : d.description;
  const renderCycleYears = Number(meta.cpe_cycle_years) || 1;
  const cpeHours = Number(meta.cpe_cycle_hours) || d.annual_cpe_required * renderCycleYears;
  const prerequisites: string[] = Array.isArray(meta.prerequisites) ? meta.prerequisites : [];
  const faqItems = buildFAQ(d, cpeCategories);

  return (
    <div className="pb-0">
      {/* Hero */}
      <DesignationHero
        name={name}
        abbreviation={d.abbreviation}
        description={desc}
        prerequisites={prerequisites}
        locale={locale}
        slug={slug}
      />

      {/* Tab Navigation */}
      <DesignationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        locale={locale}
      />

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <div className="space-y-16 py-16">
          <div className="container mx-auto px-4">
            <DesignationOverview
              abbreviation={d.abbreviation}
              description={desc}
              documentsCount={documents.length}
              cpeHours={cpeHours}
              cpeCycleYears={renderCycleYears}
              locale={locale}
            />
          </div>

          {documents.length > 0 && (
            <div className="container mx-auto px-4">
              <DesignationModules documents={documents} locale={locale} />
            </div>
          )}

          <div className="container mx-auto px-4">
            <DesignationFoundingMember
              abbreviation={d.abbreviation}
              foundingFee={d.founding_fee}
              locale={locale}
            />
          </div>

          <div className="container mx-auto px-4">
            <DesignationSteps abbreviation={d.abbreviation} locale={locale} />
          </div>

          {cpeCategories.length > 0 && (
            <div className="container mx-auto px-4">
              <DesignationCPE
                cpeCategories={cpeCategories}
                abbreviation={d.abbreviation}
                cpeHours={cpeHours}
                cpeCycleYears={renderCycleYears}
                slug={slug}
                locale={locale}
              />
            </div>
          )}

          <div className="container mx-auto px-4">
            <DesignationFAQ items={faqItems} locale={locale} />
          </div>

          <DesignationCTA
            abbreviation={d.abbreviation}
            slug={slug}
            locale={locale}
          />
        </div>
      ) : (
        <div className="py-16">
          <div className="container mx-auto px-4">
            <DesignationResources
              resources={resources}
              locale={locale}
              abbreviation={d.abbreviation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
