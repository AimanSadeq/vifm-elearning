"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Mail,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Office } from "@/lib/site-content";
import {
  OFFICES as FALLBACK_OFFICES,
  SUPPORT_EMAIL as FALLBACK_SUPPORT_EMAIL,
} from "@/lib/site-content";
import { invalidateSiteSettings } from "@/lib/hooks/useSiteSettings";

function emptyOffice(): Office {
  return {
    key: `office-${Math.random().toString(36).slice(2, 8)}`,
    city: "",
    cityAr: "",
    address: "",
    addressAr: "",
    phone: "",
    email: "",
  };
}

export default function AdminSiteContentPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [offices, setOffices] = useState<Office[]>([]);
  const [supportEmail, setSupportEmail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["offices", "support_email"]);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setOffices(FALLBACK_OFFICES);
        setSupportEmail(FALLBACK_SUPPORT_EMAIL);
        setLoading(false);
        return;
      }
      const map = new Map<string, unknown>();
      for (const row of data ?? []) map.set(row.key as string, row.value);
      setOffices(
        Array.isArray(map.get("offices"))
          ? (map.get("offices") as Office[])
          : FALLBACK_OFFICES
      );
      setSupportEmail(
        typeof map.get("support_email") === "string"
          ? (map.get("support_email") as string)
          : FALLBACK_SUPPORT_EMAIL
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    // We just treat any save as a user-initiated write; no deep-equality check.
    return true;
  }, []);
  void dirty;

  const addOffice = () => setOffices((list) => [...list, emptyOffice()]);
  const removeOffice = (key: string) =>
    setOffices((list) => list.filter((o) => o.key !== key));
  const updateOffice = (key: string, patch: Partial<Office>) =>
    setOffices((list) =>
      list.map((o) => (o.key === key ? { ...o, ...patch } : o))
    );

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const rows = [
        {
          key: "offices",
          value: offices,
          description: "Office locations shown on /about and /contact pages",
        },
        {
          key: "support_email",
          value: supportEmail,
          description:
            "Primary support email address shown on designation FAQ pages",
        },
      ];
      const { error: err } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });
      if (err) throw err;
      invalidateSiteSettings();
      setSavedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/settings`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          Back to Settings
        </Link>
        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold">Site Content</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit the offices and support email shown across /about, /contact,
              and designation FAQ pages. Changes go live immediately.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 me-2" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}
      </div>

      {/* Support email */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-brand-600" />
            Support email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="support_email" className="sr-only">
            Support email
          </Label>
          <Input
            id="support_email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="membership@viftraining.com"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Shown on designation FAQ pages as the primary support contact.
          </p>
        </CardContent>
      </Card>

      {/* Offices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-brand-600" />
            Office locations ({offices.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addOffice}>
            <Plus className="h-4 w-4 me-1" />
            Add office
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {offices.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No offices yet. Add one with the button above.
            </p>
          )}
          {offices.map((office, idx) => (
            <div
              key={office.key}
              className="rounded-xl border p-4 bg-background"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Office #{idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOffice(office.key)}
                  className="text-muted-foreground hover:text-error"
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="City (English)"
                  value={office.city}
                  onChange={(v) => updateOffice(office.key, { city: v })}
                  placeholder="Dubai, UAE"
                />
                <Field
                  label="City (Arabic)"
                  value={office.cityAr}
                  onChange={(v) => updateOffice(office.key, { cityAr: v })}
                  placeholder="دبي، الإمارات"
                  dir="rtl"
                />
                <Field
                  label="Address (English)"
                  value={office.address}
                  onChange={(v) => updateOffice(office.key, { address: v })}
                  placeholder="DIFC, Gate Village Building 3"
                />
                <Field
                  label="Address (Arabic)"
                  value={office.addressAr}
                  onChange={(v) => updateOffice(office.key, { addressAr: v })}
                  placeholder="…"
                  dir="rtl"
                />
                <Field
                  label="Phone"
                  value={office.phone}
                  onChange={(v) => updateOffice(office.key, { phone: v })}
                  placeholder="+971 4 123 4567"
                />
                <Field
                  label="Email"
                  type="email"
                  value={office.email}
                  onChange={(v) => updateOffice(office.key, { email: v })}
                  placeholder="dubai@vifm.academy"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email";
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="mt-1"
      />
    </div>
  );
}
