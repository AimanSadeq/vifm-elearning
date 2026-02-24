"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, Video, Globe, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CHRSCPEPolicyPage() {
  const locale = useLocale();

  const categories = [
    { icon: BookOpen, name: locale === "ar" ? "دورات تدريب VIFM" : "VIFM Training Courses", limit: locale === "ar" ? "غير محدود" : "Unlimited", rate: locale === "ar" ? "ساعة واحدة لكل ساعة تدريب" : "1 CPE hour per training hour", approval: locale === "ar" ? "تلقائي" : "Auto-credited", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Video, name: locale === "ar" ? "ندوات VIFM عبر الإنترنت" : "VIFM Webinars", limit: locale === "ar" ? "غير محدود" : "Unlimited", rate: locale === "ar" ? "ساعة واحدة لكل ساعة حضور" : "1 CPE hour per attendance hour", approval: locale === "ar" ? "تلقائي" : "Auto-credited", color: "text-info", bg: "bg-info/10" },
    { icon: Globe, name: locale === "ar" ? "المؤتمرات الخارجية" : "External Conferences & Workshops", limit: locale === "ar" ? "بحد أقصى 10 ساعات/سنة" : "Max 10 hours/year", rate: locale === "ar" ? "ساعة واحدة لكل ساعة حضور" : "1 CPE hour per attendance hour", approval: locale === "ar" ? "يتطلب مراجعة" : "Requires review", color: "text-accent-600", bg: "bg-accent-50" },
    { icon: FileText, name: locale === "ar" ? "الدراسة الذاتية" : "Self-Study & Research", limit: locale === "ar" ? "بحد أقصى 5 ساعات/سنة" : "Max 5 hours/year", rate: locale === "ar" ? "ساعة واحدة لكل ساعة موثقة" : "1 CPE hour per documented hour", approval: locale === "ar" ? "يتطلب مراجعة" : "Requires review", color: "text-muted-foreground", bg: "bg-muted" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <Link href={`/${locale}/designations/chrs`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />{locale === "ar" ? "العودة إلى CHRS" : "Back to CHRS"}
      </Link>

      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <Clock className="h-4 w-4" />{locale === "ar" ? "سياسة التعليم المهني المستمر" : "CPE Policy"}
        </div>
        <h1 className="font-heading text-3xl font-bold">
          {locale === "ar" ? "سياسة التعليم المهني المستمر (CPE)" : "Continuing Professional Education (CPE) Policy"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar" ? "شهادة CHRS — معهد فيرجينيا للتمويل والإدارة" : "CHRS Designation — Virginia Institute of Finance and Management"}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{locale === "ar" ? "نظرة عامة" : "Overview"}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {locale === "ar"
              ? "يجب على جميع حاملي شهادة CHRS النشطين إكمال 20 ساعة من التعليم المهني المستمر (CPE) في كل سنة تجديد (1 يوليو - 30 يونيو) للحفاظ على شهادتهم النشطة. يضمن برنامج CPE أن يظل المحترفون المعتمدون على اطلاع بأحدث التطورات في مجال الذكاء الاصطناعي والموارد البشرية."
              : "All active CHRS holders must complete 20 hours of Continuing Professional Education (CPE) per renewal year (July 1 – June 30) to maintain active certification. The CPE program ensures certified professionals stay current with evolving practices in AI and Human Resources."}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">{locale === "ar" ? "فئات CPE المؤهلة" : "Eligible CPE Categories"}</h2>
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.name}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}>
                  <cat.icon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{cat.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{locale === "ar" ? "الحد:" : "Limit:"} <strong className="text-foreground">{cat.limit}</strong></span>
                    <span>{locale === "ar" ? "المعدل:" : "Rate:"} <strong className="text-foreground">{cat.rate}</strong></span>
                    <span>{locale === "ar" ? "الموافقة:" : "Approval:"} <strong className="text-foreground">{cat.approval}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{locale === "ar" ? "التواريخ الرئيسية" : "Key Dates"}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{locale === "ar" ? "1 يوليو" : "Jul 1"}</p>
              <p className="text-xs text-muted-foreground mt-1">{locale === "ar" ? "موعد التجديد" : "Renewal Deadline"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{locale === "ar" ? "1 أكتوبر" : "Oct 1"}</p>
              <p className="text-xs text-muted-foreground mt-1">{locale === "ar" ? "نهاية فترة السماح" : "Grace Period Ends"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-success">20</p>
              <p className="text-xs text-muted-foreground mt-1">{locale === "ar" ? "ساعات CPE المطلوبة" : "CPE Hours Required"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{locale === "ar" ? "عدم الامتثال" : "Non-Compliance"}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {locale === "ar"
              ? "قد يخضع حاملو CHRS الذين لا يكملون الحد الأدنى المطلوب من ساعات CPE بحلول نهاية سنة التجديد لتعليق شهادتهم. يمكن لـ VIFM منح تمديدات في ظروف استثنائية بناءً على طلب مكتوب."
              : "CHRS holders who fail to complete the minimum required CPE hours by the end of the renewal year may be subject to certification suspension. VIFM may grant extensions in exceptional circumstances upon written request."}
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href={`/${locale}/designations/chrs`}>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{locale === "ar" ? "العودة إلى صفحة CHRS" : "Back to CHRS Page"}</Button>
        </Link>
      </div>
    </div>
  );
}
