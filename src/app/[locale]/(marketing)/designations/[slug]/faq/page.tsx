"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, AlertTriangle } from "lucide-react";
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

interface CPECategory {
  name: string;
  name_ar: string | null;
}

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

function buildFAQ(
  d: DesignationInfo,
  cpeCategories: CPECategory[]
): FAQItem[] {
  const meta = d.metadata ?? {};
  const examType =
    meta.exam_type === "simulation" ? "simulation-based" : "multiple-choice";
  const examTypeAr =
    meta.exam_type === "simulation" ? "قائم على المحاكاة" : "اختيار من متعدد";
  const passRate = Number(meta.pass_rate) || 65;
  const freeAttempts = Number(meta.free_attempts) || 2;
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
      answerAr: `التجديد السنوي هو ${d.renewal_fee} دولارا للأعضاء العاديين. يحصل الأعضاء المؤسسون على تجديد مخفض للسنة الأولى بقيمة ${d.founding_fee} دولارا. يتم تطبيق رسوم تأخير بقيمة ${d.late_fee} دولارا إذا تم التجديد خلال فترة السماح البالغة ${d.grace_period_months} أشهر.`,
    },
    {
      question: "What are the CPE requirements?",
      questionAr: "ما هي متطلبات CPE؟",
      answer: `${d.abbreviation} holders must complete ${cpeHours} hours of Continuing Professional Education (CPE) ${cycleYears === 1 ? "every year" : `every ${cycleYears} years`}. Eligible activities include ${cpeCategories.map((c) => c.name).join(", ")}.`,
      answerAr: `يجب على حاملي ${d.abbreviation} إكمال ${cpeHours} ساعة من التعليم المهني المستمر (CPE) ${cycleYears === 1 ? "كل سنة" : `كل ${cycleYears} سنوات`}. تشمل الأنشطة المؤهلة ${cpeCategories.map((c) => c.name_ar ?? c.name).join("، ")}.`,
    },
    {
      question: "What happens if I don't renew on time?",
      questionAr: "ماذا يحدث إذا لم أجدد في الوقت المحدد؟",
      answer: `After the July ${d.renewal_day} deadline, you enter a ${d.grace_period_months}-month grace period where you can still renew with a $${d.late_fee} late fee. If you don't renew by the end of the grace period, your certification is suspended. You then have 12 months to reinstate by paying the renewal fee plus the $${d.late_fee} reinstatement fee. After 12 months without reinstatement, your membership is classified as lapsed and may require re-application.`,
      answerAr: `بعد الموعد النهائي في 1 يوليو، تدخل فترة سماح مدتها ${d.grace_period_months} أشهر حيث يمكنك التجديد مع رسوم تأخير بقيمة ${d.late_fee} دولارا. إذا لم تجدد، يتم تعليق شهادتك. لديك 12 شهرا لاستعادة عضويتك بدفع رسوم التجديد بالإضافة إلى رسوم الاستعادة. بعد 12 شهرا بدون استعادة، يتم تصنيف عضويتك على أنها منتهية.`,
    },
    {
      question: "What is Founding Member status?",
      questionAr: "ما هو وضع العضو المؤسس؟",
      answer: `Founding Member status is an exclusive, limited-time recognition for professionals who earned their ${d.abbreviation} in the program's early stages. Benefits include: no re-examination required, Founding Member badge on the registry and certificate, free e-Learning Portal access, free digital DIBoK package, priority registration for VIFM programs, 5% discount on program registration, and a discounted first-year renewal fee of $${d.founding_fee} USD. This status will never be offered again to future candidates.`,
      answerAr: `وضع العضو المؤسس هو تقدير حصري ومحدود الوقت للمحترفين الذين حصلوا على ${d.abbreviation} في المراحل المبكرة. تشمل المزايا: عدم الحاجة لإعادة الاختبار، شارة العضو المؤسس، الوصول المجاني لبوابة التعلم الإلكتروني، حزمة DIBoK الرقمية المجانية، التسجيل المتقدم في برامج VIFM، وخصم 5% على رسوم التسجيل.`,
    },
    {
      question: "How do I submit CPE hours?",
      questionAr: "كيف أقدم ساعات CPE؟",
      answer: `Log in to your member dashboard and navigate to the CPE section. Submit your activity details including the type, hours claimed, date, provider name, and supporting documentation. VIFM courses and webinars are credited automatically. External conferences and self-study require review and approval.`,
      answerAr: `سجل الدخول إلى لوحة تحكم العضو وانتقل إلى قسم CPE. قدم تفاصيل نشاطك بما في ذلك النوع والساعات المطالب بها والتاريخ واسم المزود والوثائق الداعمة. يتم احتساب دورات وندوات VIFM تلقائيا. تتطلب المؤتمرات الخارجية والدراسة الذاتية المراجعة والموافقة.`,
    },
    {
      question: "How do I verify a CDIP credential?",
      questionAr: "كيف أتحقق من شهادة CDIP؟",
      answer: `Visit the public CDIP Registry to search by name, company, or member number. You can also verify individual credentials using the member's unique verification link.`,
      answerAr: `قم بزيارة سجل CDIP العام للبحث بالاسم أو الشركة أو رقم العضوية. يمكنك أيضا التحقق من الشهادات الفردية باستخدام رابط التحقق الفريد للعضو.`,
    },
  ];

  return faqs;
}

export default function DesignationFAQPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [designation, setDesignation] = useState<DesignationInfo | null>(null);
  const [cpeCategories, setCpeCategories] = useState<CPECategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

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

      setDesignation(desig as DesignationInfo);

      const { data: cats } = await supabase
        .from("cpe_categories")
        .select("name, name_ar")
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

  const faqItems = buildFAQ(designation, cpeCategories);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <Link
        href={`/${locale}/designations/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar"
          ? `العودة إلى ${designation.abbreviation}`
          : `Back to ${designation.abbreviation}`}
      </Link>

      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
          <HelpCircle className="h-4 w-4" />
          {locale === "ar" ? "الأسئلة الشائعة" : "FAQ"}
        </div>
        <h1 className="font-heading text-3xl font-bold">
          {locale === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar"
            ? `كل ما تحتاج معرفته عن شهادة ${designation.abbreviation}`
            : `Everything you need to know about the ${designation.abbreviation} designation`}
        </p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item, i) => {
          const isOpen = openIndex === i;
          const question =
            locale === "ar" ? item.questionAr : item.question;
          const answer = locale === "ar" ? item.answerAr : item.answer;

          return (
            <Card key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="pe-4 font-medium">{question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <CardContent className="pt-0 pb-5 px-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {locale === "ar"
            ? "لم تجد إجابتك؟ تواصل معنا"
            : "Didn't find your answer? Get in touch"}
        </p>
        <a href="mailto:membership@viftraining.com">
          <Button variant="outline">
            {locale === "ar"
              ? "تواصل مع membership@viftraining.com"
              : "Contact membership@viftraining.com"}
          </Button>
        </a>
      </div>

      <div className="text-center">
        <Link href={`/${locale}/designations/${slug}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === "ar"
              ? `العودة إلى صفحة ${designation.abbreviation}`
              : `Back to ${designation.abbreviation} Page`}
          </Button>
        </Link>
      </div>
    </div>
  );
}
