import { getLocale } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import {
  getCachedDesignationBySlug,
  getCachedDesignationBundle,
  type DesignationDetail,
  type CPECategoryRow,
} from "@/lib/server/catalog-data";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DesignationResource } from "@/types";
import DesignationLandingClient from "./DesignationLandingClient";

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: build FAQ from designation data — unchanged from previous */
/*  client implementation, just lifted to the server.                  */
/* ------------------------------------------------------------------ */

function buildFAQ(d: DesignationDetail, cpeCategories: CPECategoryRow[]): FAQItem[] {
  const meta = d.metadata ?? {};
  const examType =
    meta.exam_type === "simulation" ? "simulation-based" : "multiple-choice";
  const examTypeAr =
    meta.exam_type === "simulation" ? "قائم على المحاكاة" : "اختيار من متعدد";
  const passRate = Number(meta.pass_rate) || 65;
  const freeAttempts = Number(meta.free_attempts) || 2;
  const prerequisites: string[] = Array.isArray(meta.prerequisites)
    ? (meta.prerequisites as string[])
    : [];
  const cycleYears = Number(meta.cpe_cycle_years) || 1;
  const cpeHours =
    Number(meta.cpe_cycle_hours) || d.annual_cpe_required * cycleYears;

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

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Designation detail page. Pre-fetches the designation row + its bundle of
 * documents/CPE/resources/holder-count/primary-course server-side via
 * `unstable_cache` (60s revalidate), then computes the user-specific
 * `hasAccess` flag using the cookie-bound Supabase server client.
 *
 * The user-access query is intentionally NOT in the cache — it depends on
 * the authenticated user, which would otherwise be cached across visitors.
 */
export default async function DesignationLandingPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const locale = await getLocale();

  const designation = await getCachedDesignationBySlug(slug);

  if (!designation) {
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

  const bundle = await getCachedDesignationBundle(designation.id);

  // User-specific access check (NOT cached — depends on logged-in user).
  // Super admins always see the gated content; otherwise a row in
  // designation_holders with active/grace_period status grants access.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAccess = false;
  if (user) {
    if ((user.app_metadata?.role as string) === "super_admin") {
      hasAccess = true;
    } else {
      const { data: holderRow } = await supabase
        .from("designation_holders")
        .select("id")
        .eq("designation_id", designation.id)
        .eq("user_id", user.id)
        .in("status", ["active", "grace_period"])
        .limit(1)
        .maybeSingle();
      hasAccess = Boolean(holderRow);
    }
  }

  const tabParam = typeof sp.tab === "string" ? sp.tab : "";
  const initialTab: "overview" | "courseWebsite" =
    tabParam === "courseWebsite" ? "courseWebsite" : "overview";

  const faqItems = buildFAQ(designation, bundle.cpeCategories);

  return (
    <DesignationLandingClient
      designation={designation}
      documents={bundle.documents}
      cpeCategories={bundle.cpeCategories}
      resources={bundle.resources as DesignationResource[]}
      holderCount={bundle.holderCount}
      primaryCourseSlug={bundle.primaryCourseSlug}
      hasAccess={hasAccess}
      isLoggedIn={Boolean(user)}
      initialTab={initialTab}
      faqItems={faqItems}
      slug={slug}
    />
  );
}
