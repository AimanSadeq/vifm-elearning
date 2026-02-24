"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Download,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface CPECategory {
  id: string;
  name: string;
  name_ar: string | null;
  annual_max_hours: number | null;
  requires_approval: boolean;
}

interface CPESubmission {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  hours_claimed: number;
  hours_approved: number | null;
  status: string;
  activity_date: string;
  provider: string | null;
  auto_credited: boolean;
  source_type: string | null;
  reviewer_notes: string | null;
  evidence_url: string | null;
  category: {
    name: string;
    name_ar: string | null;
  } | null;
}

interface HolderInfo {
  id: string;
  cpe_hours_completed: number;
  current_period_start: string;
  current_period_end: string;
  designation: {
    annual_cpe_required: number;
    abbreviation: string;
    id: string;
  } | null;
}

export default function CPETrackerPage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [holder, setHolder] = useState<HolderInfo | null>(null);
  const [categories, setCategories] = useState<CPECategory[]>([]);
  const [submissions, setSubmissions] = useState<CPESubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cpe_category_id: "",
    title: "",
    description: "",
    hours_claimed: "",
    activity_date: "",
    provider: "",
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch holder info
      const { data: holderData } = await supabase
        .from("designation_holders")
        .select(
          `
          id,
          cpe_hours_completed,
          current_period_start,
          current_period_end,
          designation:designations!designation_holders_designation_id_fkey(
            id, annual_cpe_required, abbreviation
          )
        `
        )
        .eq("user_id", user.id)
        .single();

      if (holderData) {
        const h = holderData as unknown as HolderInfo;
        setHolder(h);

        // Fetch CPE categories for this designation
        if (h.designation?.id) {
          const { data: catData } = await supabase
            .from("cpe_categories")
            .select("id, name, name_ar, annual_max_hours, requires_approval")
            .eq("designation_id", h.designation.id)
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

          setCategories((catData ?? []) as CPECategory[]);
        }

        // Fetch submissions
        const { data: subData } = await supabase
          .from("cpe_submissions")
          .select(
            `
            id, title, title_ar, description, hours_claimed, hours_approved,
            status, activity_date, provider, auto_credited, source_type,
            reviewer_notes, evidence_url,
            category:cpe_categories!cpe_submissions_cpe_category_id_fkey(
              name, name_ar
            )
          `
          )
          .eq("holder_id", h.id)
          .order("activity_date", { ascending: false });

        setSubmissions((subData ?? []) as unknown as CPESubmission[]);
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const filteredSubmissions =
    statusFilter === "all"
      ? submissions
      : submissions.filter((s) => s.status === statusFilter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holder || !user) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const supabase = createClient();

      let evidenceUrl: string | null = null;

      // Upload evidence file if provided
      if (evidenceFile) {
        const fileExt = evidenceFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("cpe-evidence")
          .upload(filePath, evidenceFile);

        if (uploadError) throw new Error("Failed to upload evidence file");
        evidenceUrl = filePath;
      }

      const selectedCategory = categories.find((c) => c.id === formData.cpe_category_id);

      const { error: insertError } = await supabase.from("cpe_submissions").insert({
        holder_id: holder.id,
        user_id: user.id,
        designation_id: holder.designation?.id,
        cpe_category_id: formData.cpe_category_id,
        title: formData.title,
        description: formData.description || null,
        hours_claimed: parseFloat(formData.hours_claimed),
        activity_date: formData.activity_date,
        provider: formData.provider || null,
        evidence_url: evidenceUrl,
        period_start: holder.current_period_start,
        period_end: holder.current_period_end,
        status: selectedCategory?.requires_approval ? "pending" : "approved",
        auto_credited: false,
        source_type: "manual",
      });

      if (insertError) throw new Error(insertError.message);

      // Refresh submissions
      const { data: refreshed } = await supabase
        .from("cpe_submissions")
        .select(
          `
          id, title, title_ar, description, hours_claimed, hours_approved,
          status, activity_date, provider, auto_credited, source_type,
          reviewer_notes, evidence_url,
          category:cpe_categories!cpe_submissions_cpe_category_id_fkey(
            name, name_ar
          )
        `
        )
        .eq("holder_id", holder.id)
        .order("activity_date", { ascending: false });

      setSubmissions((refreshed ?? []) as unknown as CPESubmission[]);

      // Reset form
      setShowForm(false);
      setFormData({ cpe_category_id: "", title: "", description: "", hours_claimed: "", activity_date: "", provider: "" });
      setEvidenceFile(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

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
        <FileText className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          {locale === "ar" ? "لم يتم العثور على شهادة" : "No designation found"}
        </p>
      </div>
    );
  }

  const statusStyles = {
    approved: { icon: CheckCircle2, label: locale === "ar" ? "معتمد" : "Approved", color: "text-success bg-success/10" },
    pending: { icon: Clock, label: locale === "ar" ? "قيد المراجعة" : "Pending", color: "text-amber-600 bg-amber-50" },
    rejected: { icon: XCircle, label: locale === "ar" ? "مرفوض" : "Rejected", color: "text-destructive bg-destructive/10" },
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href={`/${locale}/dashboard/designations`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "ar" ? "متتبع CPE" : "CPE Tracker"}
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {locale === "ar" ? "تسجيل ساعات" : "Log Hours"}
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-4">
        {categories.map((cat) => {
          const catName = locale === "ar" && cat.name_ar ? cat.name_ar : cat.name;
          const approved = submissions
            .filter((s) => (s.category?.name === cat.name || s.category?.name_ar === cat.name_ar) && s.status === "approved")
            .reduce((sum, s) => sum + (s.hours_approved ?? s.hours_claimed), 0);
          const limit = cat.annual_max_hours;

          return (
            <Card key={cat.id}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground truncate">{catName}</p>
                <p className="text-2xl font-bold mt-1">{approved}</p>
                <p className="text-xs text-muted-foreground">
                  {limit ? `/ ${limit} ${locale === "ar" ? "ساعات" : "hrs max"}` : locale === "ar" ? "غير محدود" : "unlimited"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Submission Form */}
      {showForm && (
        <Card className="border-2 border-brand-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === "ar" ? "تسجيل نشاط CPE جديد" : "Log New CPE Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "الفئة" : "Category"} *
                  </label>
                  <select
                    required
                    value={formData.cpe_category_id}
                    onChange={(e) => setFormData({ ...formData, cpe_category_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    <option value="">{locale === "ar" ? "اختر فئة..." : "Select category..."}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {locale === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                        {cat.annual_max_hours ? ` (max ${cat.annual_max_hours} hrs)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "تاريخ النشاط" : "Activity Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.activity_date}
                    onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {locale === "ar" ? "عنوان النشاط" : "Activity Title"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={locale === "ar" ? "مثال: ورشة Power BI المتقدمة" : "e.g., Advanced Power BI Workshop"}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "الساعات المطالب بها" : "Hours Claimed"} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    max="40"
                    step="0.5"
                    value={formData.hours_claimed}
                    onChange={(e) => setFormData({ ...formData, hours_claimed: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {locale === "ar" ? "المزود" : "Provider"}
                  </label>
                  <input
                    type="text"
                    placeholder={locale === "ar" ? "مثال: Microsoft, IEEE" : "e.g., Microsoft, IEEE"}
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {locale === "ar" ? "الوصف" : "Description"}
                </label>
                <textarea
                  rows={2}
                  placeholder={locale === "ar" ? "وصف مختصر للنشاط..." : "Brief description of the activity..."}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  {locale === "ar" ? "إثبات (اختياري)" : "Evidence (optional)"}
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    {evidenceFile ? evidenceFile.name : locale === "ar" ? "رفع ملف" : "Upload file"}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {evidenceFile && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEvidenceFile(null)}>
                      {locale === "ar" ? "إزالة" : "Remove"}
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "ar" ? "PDF أو صورة، بحد أقصى 10 ميجابايت" : "PDF or image, max 10 MB"}
                </p>
              </div>

              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {locale === "ar" ? "إرسال" : "Submit"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter & Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {locale === "ar" ? "سجل الأنشطة" : "Activity History"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs outline-none"
            >
              <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
              <option value="approved">{locale === "ar" ? "معتمد" : "Approved"}</option>
              <option value="pending">{locale === "ar" ? "قيد المراجعة" : "Pending"}</option>
              <option value="rejected">{locale === "ar" ? "مرفوض" : "Rejected"}</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                {locale === "ar" ? "لا توجد أنشطة" : "No activities found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const title = locale === "ar" && sub.title_ar ? sub.title_ar : sub.title;
                const catName = locale === "ar" && sub.category?.name_ar ? sub.category.name_ar : sub.category?.name;
                const st = statusStyles[sub.status as keyof typeof statusStyles] ?? statusStyles.pending;
                const StIcon = st.icon;

                return (
                  <div key={sub.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${st.color.split(" ")[1]}`}>
                      <StIcon className={`h-4 w-4 ${st.color.split(" ")[0]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-sm">{title}</p>
                        {sub.auto_credited && (
                          <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                            {locale === "ar" ? "تلقائي" : "Auto"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {catName}
                        {sub.provider ? ` · ${sub.provider}` : ""}
                        {" · "}
                        {formatDate(sub.activity_date, locale)}
                      </p>
                      {sub.reviewer_notes && sub.status === "rejected" && (
                        <p className="text-xs text-destructive mt-1">{sub.reviewer_notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {sub.hours_approved ?? sub.hours_claimed}{" "}
                        {locale === "ar" ? "ساعات" : "hrs"}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
