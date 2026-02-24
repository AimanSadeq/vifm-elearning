"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  BarChart3,
  Brain,
  PieChart,
  Briefcase,
  Layers,
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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FAQItem {
  question: string;
  questionAr?: string;
  answer: string;
  answerAr?: string;
}

const knowledgeAreas = [
  {
    icon: Layers,
    title: "Foundations",
    titleAr: "الأسس",
    description: "Overview of Data Intelligence, the CDIP framework, and the DI lifecycle.",
    descriptionAr: "نظرة عامة على ذكاء البيانات وإطار عمل CDIP ودورة حياة ذكاء البيانات.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: Database,
    title: "Data Acquisition",
    titleAr: "اكتساب البيانات",
    description: "Connecting to data sources using Power Query across databases, APIs, and files.",
    descriptionAr: "الاتصال بمصادر البيانات باستخدام Power Query عبر قواعد البيانات والواجهات والملفات.",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: RefreshCw,
    title: "Data Transformation",
    titleAr: "تحويل البيانات",
    description: "Cleaning and reshaping data with Power Query (M) for analysis-ready datasets.",
    descriptionAr: "تنظيف وإعادة تشكيل البيانات باستخدام Power Query (M) لمجموعات بيانات جاهزة للتحليل.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: BarChart3,
    title: "Data Modeling",
    titleAr: "نمذجة البيانات",
    description: "Structuring data into star schema with Power Pivot and DAX foundations.",
    descriptionAr: "هيكلة البيانات في مخطط نجمي باستخدام Power Pivot وأساسيات DAX.",
    color: "text-accent-600",
    bg: "bg-accent-50",
  },
  {
    icon: Brain,
    title: "Analytical Intelligence",
    titleAr: "الذكاء التحليلي",
    description: "Extracting insights with DAX calculations, KPIs, and advanced Pivot Tables.",
    descriptionAr: "استخراج الرؤى من خلال حسابات DAX ومؤشرات الأداء وجداول Pivot المتقدمة.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: PieChart,
    title: "Visualization",
    titleAr: "التصور",
    description: "Communicating visually with Power BI dashboards and Excel chart best practices.",
    descriptionAr: "التواصل البصري من خلال لوحات Power BI وأفضل ممارسات مخططات Excel.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Briefcase,
    title: "Professional Practice",
    titleAr: "الممارسة المهنية",
    description: "Delivering and governing analytics solutions with ethical, professional standards.",
    descriptionAr: "تقديم وإدارة حلول التحليلات بمعايير أخلاقية ومهنية.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const foundingBenefits = [
  { text: "No re-examination required", textAr: "لا يلزم إعادة الامتحان" },
  { text: "Founding Member designation on certificate and registry", textAr: "تسمية عضو مؤسس على الشهادة والسجل" },
  { text: "Free access to VIFM e-Learning Portal", textAr: "وصول مجاني إلى بوابة التعلم الإلكتروني" },
  { text: "Free digital DIBoK (7 documents)", textAr: "DIBoK رقمي مجاني (7 وثائق)" },
  { text: "Discounted first-year renewal: $50 USD", textAr: "تجديد مخفض للسنة الأولى: 50 دولار" },
  { text: "Priority registration for all VIFM programs", textAr: "تسجيل ذو أولوية لجميع برامج VIFM" },
  { text: "Listed in the official CDIP Registry", textAr: "مدرج في سجل CDIP الرسمي" },
];

const certificationSteps = [
  {
    step: 1,
    icon: BookOpen,
    title: "Enroll",
    titleAr: "التسجيل",
    description: "Sign up for the CDIP certification course on the VIFM eLearning Portal.",
    descriptionAr: "سجل في دورة شهادة CDIP على بوابة التعلم الإلكتروني.",
  },
  {
    step: 2,
    icon: GraduationCap,
    title: "Study",
    titleAr: "الدراسة",
    description: "Complete all 7 DIBoK knowledge areas through structured lessons, quizzes, and hands-on labs.",
    descriptionAr: "أكمل جميع مجالات المعرفة السبعة من خلال الدروس والاختبارات والمختبرات العملية.",
  },
  {
    step: 3,
    icon: FileText,
    title: "Pass the Exam",
    titleAr: "اجتياز الامتحان",
    description: "Pass the CDIP certification exam demonstrating mastery across all knowledge areas.",
    descriptionAr: "اجتاز امتحان شهادة CDIP الذي يثبت إتقانك لجميع مجالات المعرفة.",
  },
  {
    step: 4,
    icon: Award,
    title: "Get Certified",
    titleAr: "الحصول على الشهادة",
    description: "Receive your CDIP certificate, digital badge, and listing on the public registry.",
    descriptionAr: "احصل على شهادة CDIP والشارة الرقمية والإدراج في السجل العام.",
  },
];

const faqItems: FAQItem[] = [
  {
    question: "What is the CDIP certification?",
    questionAr: "ما هي شهادة CDIP؟",
    answer: "The Certified Data Intelligence Professional (CDIP) is a professional designation issued by the Virginia Institute of Finance and Management (VIFM). It validates expertise across the full Data Intelligence lifecycle, backed by the DIBoK (Data Intelligence Body of Knowledge).",
    answerAr: "محترف ذكاء البيانات المعتمد (CDIP) هو تسمية مهنية صادرة عن معهد فيرجينيا للتمويل والإدارة (VIFM). تثبت الخبرة عبر دورة حياة ذكاء البيانات الكاملة، مدعومة بإطار DIBoK.",
  },
  {
    question: "How much does annual renewal cost?",
    questionAr: "كم تكلفة التجديد السنوي؟",
    answer: "Annual renewal is $70 USD for Standard members. Founding Members receive a discounted first-year renewal of $50 USD. A $30 late fee applies if renewal occurs during the 3-month grace period after the July 1 deadline.",
    answerAr: "التجديد السنوي هو 70 دولارًا للأعضاء العاديين. يحصل الأعضاء المؤسسون على تجديد مخفض للسنة الأولى بقيمة 50 دولارًا. يتم تطبيق رسوم تأخير بقيمة 30 دولارًا إذا تم التجديد خلال فترة السماح البالغة 3 أشهر بعد الموعد النهائي في 1 يوليو.",
  },
  {
    question: "What are the CPE requirements?",
    questionAr: "ما هي متطلبات CPE؟",
    answer: "CDIP holders must complete 20 hours of Continuing Professional Education (CPE) per renewal year (July 1 – June 30). Eligible activities include VIFM courses (unlimited), VIFM webinars (unlimited), external conferences (max 10 hrs/yr), and self-study (max 5 hrs/yr).",
    answerAr: "يجب على حاملي CDIP إكمال 20 ساعة من التعليم المهني المستمر (CPE) سنويًا (1 يوليو - 30 يونيو). تشمل الأنشطة المؤهلة دورات VIFM (غير محدودة) وندوات VIFM (غير محدودة) والمؤتمرات الخارجية (بحد أقصى 10 ساعات/سنة) والدراسة الذاتية (بحد أقصى 5 ساعات/سنة).",
  },
  {
    question: "What happens if I don't renew on time?",
    questionAr: "ماذا يحدث إذا لم أجدد في الوقت المحدد؟",
    answer: "After the July 1 deadline, you enter a 3-month grace period (until October 1) where you can still renew with a $30 late fee. If you don't renew by October 1, your certification is suspended — you lose registry listing, e-learning access, and cannot use the CDIP designation. You can reinstate within 12 months by paying outstanding dues plus the $30 reinstatement fee.",
    answerAr: "بعد الموعد النهائي في 1 يوليو، تدخل فترة سماح مدتها 3 أشهر (حتى 1 أكتوبر) حيث يمكنك التجديد مع رسوم تأخير بقيمة 30 دولارًا. إذا لم تجدد بحلول 1 أكتوبر، يتم تعليق شهادتك.",
  },
  {
    question: "Is my information visible on the public registry?",
    questionAr: "هل معلوماتي مرئية في السجل العام؟",
    answer: "By default, active CDIP holders are listed in the public registry showing name, company, certification date, and tier. You can opt out at any time from your dashboard settings — your certification remains valid but your profile won't appear in public searches.",
    answerAr: "بشكل افتراضي، يتم إدراج حاملي CDIP النشطين في السجل العام مع الاسم والشركة وتاريخ الشهادة والمستوى. يمكنك إلغاء الاشتراك في أي وقت من إعدادات لوحة التحكم.",
  },
  {
    question: "What is Founding Member status?",
    questionAr: "ما هو وضع العضو المؤسس؟",
    answer: "Founding Member is an elite tier for professionals who were certified before the formal DIBoK was established. This status will never be offered again to future candidates. Founding Members enjoy discounted renewal, no re-examination, and a distinctive badge on their certificate and registry listing.",
    answerAr: "العضو المؤسس هو مستوى نخبوي للمحترفين الذين حصلوا على الشهادة قبل إنشاء DIBoK الرسمي. لن يتم تقديم هذه الحالة مرة أخرى للمرشحين المستقبليين.",
  },
];

function FAQAccordion({ items, locale }: { items: FAQItem[]; locale: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const question = locale === "ar" && item.questionAr ? item.questionAr : item.question;
        const answer = locale === "ar" && item.answerAr ? item.answerAr : item.answer;
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

export default function CDIPLandingPage() {
  const locale = useLocale();

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
          <h1 className="font-heading text-4xl font-bold sm:text-5xl lg:text-6xl">
            {locale === "ar"
              ? "محترف ذكاء البيانات المعتمد"
              : "Certified Data Intelligence Professional"}
          </h1>
          <p className="mt-2 text-2xl font-semibold text-white/90">CDIP</p>
          <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            {locale === "ar"
              ? "شهادة CDIP تثبت خبرتك عبر دورة حياة ذكاء البيانات الكاملة — من اكتساب البيانات إلى التصور والممارسة المهنية. مدعومة بإطار DIBoK."
              : "Validate your expertise across the full Data Intelligence lifecycle — from data acquisition to visualization and professional practice. Backed by the DIBoK framework."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/courses`}>
              <Button size="lg" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-white/90 font-semibold">
                <GraduationCap className="mr-2 h-5 w-5" />
                {locale === "ar" ? "احصل على الشهادة" : "Get Certified"}
              </Button>
            </Link>
            <Link href={`/${locale}/designations/cdip/registry`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10">
                <Users className="mr-2 h-5 w-5" />
                {locale === "ar" ? "عرض السجل" : "View Registry"}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/designations/renew`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10">
                <RefreshCw className="mr-2 h-5 w-5" />
                {locale === "ar" ? "تجديد" : "Renew"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── What is CDIP? ── */}
      <section className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-3xl font-bold">
          {locale === "ar" ? "ما هي شهادة CDIP؟" : "What is CDIP?"}
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          {locale === "ar"
            ? "شهادة محترف ذكاء البيانات المعتمد (CDIP) صادرة عن معهد فيرجينيا للتمويل والإدارة (VIFM). تثبت الكفاءة عبر سبعة مجالات معرفية تغطي دورة حياة ذكاء البيانات الكاملة. تضع CDIP حامليها إلى جانب الشهادات المعترف بها عالمياً مثل PMP وCFA وCISA."
            : "The Certified Data Intelligence Professional (CDIP) is a professional designation issued by the Virginia Institute of Finance and Management (VIFM). It validates competency across seven knowledge areas spanning the full Data Intelligence lifecycle. CDIP positions holders alongside globally recognized credentials like PMP, CFA, and CISA."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-brand-600" />
            {locale === "ar" ? "معترف بها صناعياً" : "Industry Recognized"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-5 w-5 text-brand-600" />
            {locale === "ar" ? "7 مجالات معرفية" : "7 Knowledge Areas"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-5 w-5 text-brand-600" />
            {locale === "ar" ? "20 ساعة CPE سنوياً" : "20 CPE Hours/Year"}
          </div>
        </div>
      </section>

      {/* ── Knowledge Areas ── */}
      <section>
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold">
            {locale === "ar" ? "مجالات المعرفة — DIBoK" : "Knowledge Areas — DIBoK"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? "إطار عمل هيكل معرفة ذكاء البيانات"
              : "The Data Intelligence Body of Knowledge framework"}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {knowledgeAreas.map((area) => {
            const title = locale === "ar" && area.titleAr ? area.titleAr : area.title;
            const desc = locale === "ar" && area.descriptionAr ? area.descriptionAr : area.description;

            return (
              <Card key={area.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${area.bg}`}>
                    <area.icon className={`h-6 w-6 ${area.color}`} />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

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
                ? "حالة نخبوية للمحترفين الذين حصلوا على الشهادة قبل إنشاء DIBoK الرسمي. لن يتم تقديم هذه الحالة مرة أخرى للمرشحين المستقبليين."
                : "Elite status for professionals who certified before the formal DIBoK was established. This status will never be offered again to future candidates."}
            </p>
            <ul className="mt-6 space-y-3">
              {foundingBenefits.map((benefit) => {
                const text = locale === "ar" && benefit.textAr ? benefit.textAr : benefit.text;
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
            {locale === "ar" ? "أربع خطوات لتصبح محترف CDIP" : "Four steps to becoming a CDIP professional"}
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certificationSteps.map((step) => {
            const title = locale === "ar" && step.titleAr ? step.titleAr : step.title;
            const desc = locale === "ar" && step.descriptionAr ? step.descriptionAr : step.description;

            return (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                  <step.icon className="h-8 w-8 text-brand-600" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
              ? "يجب على حاملي CDIP إكمال 20 ساعة من CPE سنويًا للحفاظ على شهادتهم النشطة."
              : "CDIP holders must complete 20 CPE hours per renewal year to maintain active certification."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { category: locale === "ar" ? "دورات تدريب VIFM" : "VIFM Training Courses", limit: locale === "ar" ? "غير محدود" : "Unlimited", color: "bg-brand-600" },
              { category: locale === "ar" ? "ندوات VIFM" : "VIFM Webinars", limit: locale === "ar" ? "غير محدود" : "Unlimited", color: "bg-info" },
              { category: locale === "ar" ? "المؤتمرات الخارجية" : "External Conferences", limit: locale === "ar" ? "بحد أقصى 10 ساعات/سنة" : "Max 10 hrs/year", color: "bg-accent-600" },
              { category: locale === "ar" ? "الدراسة الذاتية" : "Self-Study", limit: locale === "ar" ? "بحد أقصى 5 ساعات/سنة" : "Max 5 hrs/year", color: "bg-muted-foreground" },
            ].map((item) => (
              <div key={item.category} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.category}</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{item.limit}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href={`/${locale}/designations/cdip/cpe-policy`}>
              <Button variant="outline" size="sm">
                {locale === "ar" ? "عرض سياسة CPE الكاملة" : "View Full CPE Policy"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
            ? "انضم إلى مجتمع متنامٍ من محترفي ذكاء البيانات المعتمدين. أثبت خبرتك. تميز عن الآخرين."
            : "Join a growing community of certified Data Intelligence professionals. Prove your expertise. Stand out from the crowd."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/${locale}/courses`}>
            <Button size="lg" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-white/90 font-semibold">
              {locale === "ar" ? "ابدأ الآن" : "Get Started"}
            </Button>
          </Link>
          <Link href={`/${locale}/designations/cdip/registry`}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10">
              {locale === "ar" ? "تصفح السجل" : "Browse the Registry"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
