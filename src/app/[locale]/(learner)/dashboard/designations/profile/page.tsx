"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Building2,
  Briefcase,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface ProfileData {
  holderId: string;
  showInRegistry: boolean;
  registryCompany: string;
  registryCompanyAr: string;
  registryTitle: string;
  registryTitleAr: string;
  memberNumber: string;
}

export default function RegistryProfilePage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    showInRegistry: true,
    registryCompany: "",
    registryCompanyAr: "",
    registryTitle: "",
    registryTitleAr: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase
        .from("designation_holders")
        .select(
          "id, show_in_registry, registry_company, registry_company_ar, registry_title, registry_title_ar, member_number"
        )
        .eq("user_id", user.id)
        .single();

      if (data) {
        const p: ProfileData = {
          holderId: data.id,
          showInRegistry: data.show_in_registry,
          registryCompany: data.registry_company ?? "",
          registryCompanyAr: data.registry_company_ar ?? "",
          registryTitle: data.registry_title ?? "",
          registryTitleAr: data.registry_title_ar ?? "",
          memberNumber: data.member_number,
        };
        setProfile(p);
        setFormData({
          showInRegistry: p.showInRegistry,
          registryCompany: p.registryCompany,
          registryCompanyAr: p.registryCompanyAr,
          registryTitle: p.registryTitle,
          registryTitleAr: p.registryTitleAr,
        });
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchProfile();
  }, [user, authLoading]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("designation_holders")
        .update({
          show_in_registry: formData.showInRegistry,
          registry_company: formData.registryCompany || null,
          registry_company_ar: formData.registryCompanyAr || null,
          registry_title: formData.registryTitle || null,
          registry_title_ar: formData.registryTitleAr || null,
        })
        .eq("id", profile.holderId);

      if (updateError) throw new Error(updateError.message);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Globe className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          {locale === "ar" ? "لم يتم العثور على شهادة" : "No designation found"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/${locale}/dashboard/designations`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold">
          {locale === "ar" ? "ملف السجل العام" : "Registry Profile"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {locale === "ar"
            ? "تحكم في كيفية ظهورك في سجل CDIP العام."
            : "Control how you appear on the public CDIP Registry."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visibility Toggle */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.showInRegistry ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <Eye className="h-5 w-5 text-success" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {locale === "ar" ? "الظهور في السجل العام" : "Public Registry Listing"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.showInRegistry
                      ? locale === "ar"
                        ? "ملفك مرئي للجمهور"
                        : "Your profile is visible to the public"
                      : locale === "ar"
                        ? "ملفك مخفي من السجل العام"
                        : "Your profile is hidden from the public registry"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.showInRegistry}
                onClick={() => setFormData({ ...formData, showInRegistry: !formData.showInRegistry })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  formData.showInRegistry ? "bg-success" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    formData.showInRegistry ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Company & Title (English) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {locale === "ar" ? "معلومات العرض (إنجليزي)" : "Display Information (English)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {locale === "ar" ? "اسم الشركة" : "Company Name"}
              </label>
              <input
                type="text"
                placeholder={locale === "ar" ? "مثال: بنك الإمارات" : "e.g., Emirates Bank"}
                value={formData.registryCompany}
                onChange={(e) => setFormData({ ...formData, registryCompany: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {locale === "ar" ? "المسمى الوظيفي" : "Job Title"}
              </label>
              <input
                type="text"
                placeholder={locale === "ar" ? "مثال: محلل بيانات أول" : "e.g., Senior Data Analyst"}
                value={formData.registryTitle}
                onChange={(e) => setFormData({ ...formData, registryTitle: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Company & Title (Arabic) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {locale === "ar" ? "معلومات العرض (عربي)" : "Display Information (Arabic)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {locale === "ar" ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}
              </label>
              <input
                type="text"
                dir="rtl"
                placeholder="مثال: بنك الإمارات"
                value={formData.registryCompanyAr}
                onChange={(e) => setFormData({ ...formData, registryCompanyAr: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {locale === "ar" ? "المسمى الوظيفي (عربي)" : "Job Title (Arabic)"}
              </label>
              <input
                type="text"
                dir="rtl"
                placeholder="مثال: محلل بيانات أول"
                value={formData.registryTitleAr}
                onChange={(e) => setFormData({ ...formData, registryTitleAr: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.showInRegistry && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {locale === "ar" ? "معاينة السجل" : "Registry Preview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Briefcase className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold">{user?.full_name ?? "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.registryCompany || (locale === "ar" ? "(لم يتم تعيين الشركة)" : "(no company set)")}
                    {formData.registryTitle ? ` · ${formData.registryTitle}` : ""}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {profile.memberNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error / Success */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {saved && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-sm text-success font-medium">
              {locale === "ar" ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully"}
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
