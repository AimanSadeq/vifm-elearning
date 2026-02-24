"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  BookOpen,
  Users,
  Shield,
  Star,
  ArrowRight,
  GraduationCap,
  FileText,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
  metadata: Record<string, any> | null;
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
/*  FAQ Accordion                                                      */
/* ------------------------------------------------------------------ */

function FAQAccordion({ items, locale }: { items: FAQItem[]; locale: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const question = locale === "ar" ? item.questionAr : item.question;
        const answer = locale === "ar" ? item.answerAr : item.answer;
        const isOpen = openIndex === index;

        return (
          <div key={index} className="rounded-lg border bg-card">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-medium">{question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Module color palette                                               */
/* ------------------------------------------------------------------ */

const moduleColors = [
  { color: "text-brand-600", bg: "bg-brand-50" },
  { color: "text-info", bg: "bg-info/10" },
  { color: "text-success", bg: "bg-success/10" },
  { color: "text-accent-600", bg: "bg-accent-50" },
  { color: "text-purple-600", bg: "bg-purple-50" },
  { color: "text-orange-600", bg: "bg-orange-50" },
  { color: "text-rose-600", bg: "bg-rose-50" },
  { color: "text-teal-600", bg: "bg-teal-50" },
  { color: "text-indigo-600", bg: "bg-indigo-50" },
];

/* ------------------------------------------------------------------ */
/*  Helper: build FAQ from designation data                            */
/* ------------------------------------------------------------------ */

function buildFAQ(d: DesignationData, cpeCategories: CPECategory[]): FAQItem[] {
  const meta = d.metadata ?? {};
  const examType = meta.exam_type === "simulation" ? "simulation-based" : "multiple-choice";
  const examTypeAr = meta.exam_type === "simulation" ? "قائم على المحاكاة" : "اختيار من متعدد";
  const passRate = meta.pass_rate ?? 65;
  const freeAttempts = meta.free_attempts ?? 2;
  const prerequisites: string[] = meta.prerequisites ?? [];
  const cpeHours = meta.cpe_cycle_hours ?? d.annual_cpe_required * (meta.cpe_cycle_years ?? 1);
  const cpeCycleYears = meta.cpe_cycle_years ?? 1;

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
      answer: `${d.abbreviation} holders must complete ${cpeHours} hours of Continuing Professional Education (CPE) every ${cpeCycleYears} years. Eligible activities include ${cpeCategories.map((c) => c.name).join(", ")}.`,
      answerAr: `يجب على حاملي ${d.abbreviation} إكمال ${cpeHours} ساعة من التعليم المهني المستمر (CPE) كل ${cpeCycleYears} سنوات. تشمل الأنشطة المؤهلة ${cpeCategories.map((c) => c.name_ar ?? c.name).join("، ")}.`,
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
/*  Certification steps (universal)                                    */
/* ------------------------------------------------------------------ */

function getCertificationSteps(abbreviation: string) {
  return [
    {
      step: 1,
      icon: BookOpen,
      title: "Enroll",
      titleAr: "التسجيل",
      description: `Sign up for the ${abbreviation} certification course on the VIFM eLearning Portal.`,
      descriptionAr: `سجل في دورة شهادة ${abbreviation} على بوابة التعلم الإلكتروني.`,
    },
    {
      step: 2,
      icon: GraduationCap,
      title: "Study",
      titleAr: "الدراسة",
      description: "Complete all course modules through structured lessons, quizzes, and hands-on labs.",
      descriptionAr: "أكمل جميع وحدات الدورة من خلال الدروس والاختبارات والمختبرات العملية.",
    },
    {
      step: 3,
      icon: FileText,
      title: "Pass the Exam",
      titleAr: "اجتياز الامتحان",
      description: `Pass the ${abbreviation} certification exam demonstrating mastery across all knowledge areas.`,
      descriptionAr: `اجتز امتحان شهادة ${abbreviation} الذي يثبت إتقانك لجميع مجالات المعرفة.`,
    },
    {
      step: 4,
      icon: Award,
      title: "Get Certified",
      titleAr: "الحصول على الشهادة",
      description: `Receive your ${abbreviation} certificate, digital badge, and listing on the public registry.`,
      descriptionAr: `احصل على شهادة ${abbreviation} والشارة الرقمية والإدراج في السجل العام.`,
    },
  ];
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
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

      // Fetch documents/modules
      const { data: docs } = await supabase
        .from("designation_documents")
        .select("id, title, title_ar, description, sort_order")
        .eq("designation_id", desig.id)
        .order("sort_order");

      setDocuments((docs ?? []) as DesignationDocument[]);

      // Fetch CPE categories
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
  const cpeHours = meta.cpe_cycle_hours ?? d.annual_cpe_required * (meta.cpe_cycle_years ?? 1);
  const cpeCycleYears = meta.cpe_cycle_years ?? 1;
  const prerequisites: string[] = meta.prerequisites ?? [];
  const certificationSteps = getCertificationSteps(d.abbreviation);
  const faqItems = buildFAQ(d, cpeCategories);

  const foundingBenefits = [
    {
      text: "No re-examination required",
      textAr: "لا يلزم إعادة الامتحان",
    },
    {
      text: "Founding Member designation on certificate and registry",
      textAr: "تسمية عضو مؤسس على الشهادة والسجل",
    },
    {
      text: "Free access to VIFM e-Learning Portal",
      textAr: "وصول مجاني إلى بوابة التعلم الإلكتروني",
    },
    {
      text: `Discounted first-year renewal: $${d.founding_fee} USD`,
      textAr: `تجديد مخفض للسنة الأولى: ${d.founding_fee} دولار`,
    },
    {
      text: "Priority registration for all VIFM programs",
      textAr: "تسجيل ذو أولوية لجميع برامج VIFM",
    },
    {
      text: `Listed in the official ${d.abbreviation} Registry`,
      textAr: `مدرج في سجل ${d.abbreviation} الرسمي`,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 text-white sm:px-12 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <Award className="h-4 w-4" />
            {locale === "ar" ? "تسمية مهنية من VIFM" : "Professional Designation by VIFM"}
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">{name}</h1>
          <p className="mt-2 text-2xl font-semibold text-white/90">{d.abbreviation}</p>
          <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">{desc}</p>

          {prerequisites.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              {locale === "ar"
                ? `يتطلب: ${prerequisites.join(" أو ")}`
                : `Requires: ${prerequisites.join(" or ")}`}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/courses`}>
              <Button size="lg" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-white/90 font-semibold">
                <GraduationCap className="mr-2 h-5 w-5" />
                {locale === "ar" ? "احصل على الشهادة" : "Get Certified"}
              </Button>
            </Link>
            <Link href={`/${locale}/designations/${slug}/registry`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white/10">
                <Users className="mr-2 h-5 w-5" />
                {locale === "ar" ? "عرض السجل" : "View Registry"}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/designations/renew`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white/10">
                <RefreshCw className="mr-2 h-5 w-5" />
                {locale === "ar" ? "تجديد" : "Renew"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── What is [ABBR]? ── */}
      <section className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-3xl font-bold">
          {locale === "ar" ? `ما هي شهادة ${d.abbreviation}؟` : `What is ${d.abbreviation}?`}
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">{desc}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-brand-600" />
            {locale === "ar" ? "معترف بها صناعياً" : "Industry Recognized"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-5 w-5 text-brand-600" />
            {documents.length > 0
              ? locale === "ar"
                ? `${documents.length} وحدات`
                : `${documents.length} Modules`
              : locale === "ar"
              ? "منهج شامل"
              : "Comprehensive Curriculum"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 text-brand-600" />
            {locale === "ar"
              ? `${cpeHours} ساعة CPE / ${cpeCycleYears} سنوات`
              : `${cpeHours} CPE Hours / ${cpeCycleYears} Years`}
          </div>
        </div>
      </section>

      {/* ── Course Modules ── */}
      {documents.length > 0 && (
        <section>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold">
              {locale === "ar" ? "وحدات المنهج" : "Course Modules"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {locale === "ar"
                ? `${documents.length} وحدات تغطي المعرفة الكاملة لشهادة ${d.abbreviation}`
                : `${documents.length} modules covering the full ${d.abbreviation} body of knowledge`}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc, i) => {
              const palette = moduleColors[i % moduleColors.length];
              const title = locale === "ar" && doc.title_ar ? doc.title_ar : doc.title;

              return (
                <Card key={doc.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${palette.bg}`}>
                      <BookOpen className={`h-6 w-6 ${palette.color}`} />
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                    {doc.description && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Founding Member ── */}
      <section className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 sm:p-12">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left lg:gap-12">
          <div className="mb-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
            <Star className="h-10 w-10 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 uppercase tracking-wide">
              {locale === "ar" ? "وقت محدود" : "Limited Time"}
            </div>
            <h2 className="mt-3 font-heading text-3xl font-bold text-amber-900">
              {locale === "ar" ? "وضع العضو المؤسس" : "Founding Member Status"}
            </h2>
            <p className="mt-3 text-amber-800/80 leading-relaxed">
              {locale === "ar"
                ? `حالة نخبوية للمحترفين الذين حصلوا على شهادة ${d.abbreviation} في مراحلها الأولى. لن يتم تقديم هذه الحالة مرة أخرى للمرشحين المستقبليين.`
                : `Elite status for professionals who earned the ${d.abbreviation} in its early stages. This status will never be offered again to future candidates.`}
            </p>
            <ul className="mt-6 space-y-3">
              {foundingBenefits.map((benefit) => {
                const text = locale === "ar" ? benefit.textAr : benefit.text;
                return (
                  <li key={benefit.text} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <span className="text-amber-900">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How to Get Certified ── */}
      <section>
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">
            {locale === "ar" ? "كيف تحصل على الشهادة" : "How to Get Certified"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? `أربع خطوات لتصبح محترف ${d.abbreviation}`
              : `Four steps to becoming a ${d.abbreviation} professional`}
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certificationSteps.map((step) => {
            const title = locale === "ar" ? step.titleAr : step.title;
            const stepDesc = locale === "ar" ? step.descriptionAr : step.description;

            return (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                  <step.icon className="h-8 w-8 text-brand-600" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{stepDesc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Link href={`/${locale}/courses`}>
            <Button size="lg" className="font-semibold">
              {locale === "ar" ? "ابدأ رحلتك" : "Start Your Journey"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── CPE Summary ── */}
      {cpeCategories.length > 0 && (
        <section className="rounded-2xl bg-muted/50 p-8 sm:p-12">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 justify-center mb-6">
              <Clock className="h-8 w-8 text-brand-600" />
              <h2 className="font-heading text-3xl font-bold">
                {locale === "ar" ? "التعليم المهني المستمر (CPE)" : "Continuing Professional Education (CPE)"}
              </h2>
            </div>
            <p className="text-center text-muted-foreground mb-8">
              {locale === "ar"
                ? `يجب على حاملي ${d.abbreviation} إكمال ${cpeHours} ساعة من CPE كل ${cpeCycleYears} سنوات للحفاظ على شهادتهم النشطة.`
                : `${d.abbreviation} holders must complete ${cpeHours} CPE hours every ${cpeCycleYears} years to maintain active certification.`}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {cpeCategories.map((cat, i) => {
                const catName = locale === "ar" && cat.name_ar ? cat.name_ar : cat.name;
                const limit = cat.annual_max_hours
                  ? locale === "ar"
                    ? `بحد أقصى ${cat.annual_max_hours} ساعات/سنة`
                    : `Max ${cat.annual_max_hours} hrs/year`
                  : locale === "ar"
                  ? "غير محدود"
                  : "Unlimited";
                const colors = ["bg-brand-600", "bg-info", "bg-accent-600", "bg-muted-foreground"];

                return (
                  <div key={cat.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                    <div className={`h-3 w-3 rounded-full ${colors[i % colors.length]}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{catName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{limit}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href={`/${locale}/designations/${slug}/cpe-policy`}>
                <Button variant="outline" size="sm">
                  {locale === "ar" ? "عرض سياسة CPE الكاملة" : "View Full CPE Policy"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl">
        <h2 className="font-heading text-3xl font-bold text-center mb-8">
          {locale === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        </h2>
        <FAQAccordion items={faqItems} locale={locale} />
      </section>

      {/* ── Final CTA ── */}
      <section className="rounded-2xl bg-brand-600 p-8 sm:p-12 text-center text-white">
        <h2 className="font-heading text-3xl font-bold">
          {locale === "ar" ? "هل أنت مستعد لرفع مسيرتك المهنية؟" : "Ready to Elevate Your Career?"}
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          {locale === "ar"
            ? `انضم إلى مجتمع متنامٍ من محترفي ${d.abbreviation} المعتمدين. أثبت خبرتك. تميز عن الآخرين.`
            : `Join a growing community of certified ${d.abbreviation} professionals. Prove your expertise. Stand out from the crowd.`}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/${locale}/courses`}>
            <Button size="lg" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-white/90 font-semibold">
              {locale === "ar" ? "ابدأ الآن" : "Get Started"}
            </Button>
          </Link>
          <Link href={`/${locale}/designations/${slug}/registry`}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white/10">
              {locale === "ar" ? "تصفح السجل" : "Browse the Registry"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
