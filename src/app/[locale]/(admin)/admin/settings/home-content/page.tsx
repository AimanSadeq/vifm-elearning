"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Sparkles,
  LayoutGrid,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { invalidateSiteSettings } from "@/lib/hooks/useSiteSettings";

// Shapes mirror what the Flutter app + web home read from site_settings.
interface Hero {
  badge: string;
  badgeAr: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
}
interface Cta {
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
}
interface Feature {
  key: string;
  icon: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

const ICON_OPTIONS = [
  "bilingual",
  "video",
  "quiz",
  "cpe",
  "certificate",
  "exam",
];

const EMPTY_HERO: Hero = {
  badge: "",
  badgeAr: "",
  title: "",
  titleAr: "",
  subtitle: "",
  subtitleAr: "",
};
const EMPTY_CTA: Cta = { title: "", titleAr: "", subtitle: "", subtitleAr: "" };

function emptyFeature(): Feature {
  return {
    key: `feature-${Math.random().toString(36).slice(2, 8)}`,
    icon: "certificate",
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
  };
}

export default function AdminHomeContentPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hero, setHero] = useState<Hero>(EMPTY_HERO);
  const [cta, setCta] = useState<Cta>(EMPTY_CTA);
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["homepage_hero", "platform_features", "homepage_cta"]);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const map = new Map<string, unknown>();
      for (const row of data ?? []) map.set(row.key as string, row.value);
      if (map.get("homepage_hero") && typeof map.get("homepage_hero") === "object")
        setHero({ ...EMPTY_HERO, ...(map.get("homepage_hero") as Hero) });
      if (map.get("homepage_cta") && typeof map.get("homepage_cta") === "object")
        setCta({ ...EMPTY_CTA, ...(map.get("homepage_cta") as Cta) });
      if (Array.isArray(map.get("platform_features")))
        setFeatures(
          (map.get("platform_features") as Feature[]).map((f) => ({
            ...emptyFeature(),
            ...f,
          }))
        );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addFeature = () => setFeatures((l) => [...l, emptyFeature()]);
  const removeFeature = (key: string) =>
    setFeatures((l) => l.filter((f) => f.key !== key));
  const updateFeature = (key: string, patch: Partial<Feature>) =>
    setFeatures((l) => l.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const rows = [
        {
          key: "homepage_hero",
          value: hero,
          description:
            "Marketing hero on the app/web home — badge, title and subtitle (EN + AR).",
        },
        {
          key: "platform_features",
          value: features,
          description:
            "The platform capability cards shown on the home (EN + AR). icon = bilingual|video|quiz|cpe|certificate|exam.",
        },
        {
          key: "homepage_cta",
          value: cta,
          description:
            "Closing call-to-action copy on the home — title + subtitle (EN + AR).",
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
            <h1 className="font-heading text-2xl font-bold">Home content</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit the marketing hero, platform feature cards, and closing CTA
              shown on the mobile app home and the website. Changes go live
              immediately.
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

      {/* Hero */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Hero
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Badge (English)" value={hero.badge} onChange={(v) => setHero({ ...hero, badge: v })} placeholder="Professional E-Learning Platform" />
          <Field label="Badge (Arabic)" value={hero.badgeAr} onChange={(v) => setHero({ ...hero, badgeAr: v })} dir="rtl" />
          <Field label="Title (English)" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
          <Field label="Title (Arabic)" value={hero.titleAr} onChange={(v) => setHero({ ...hero, titleAr: v })} dir="rtl" />
          <AreaField label="Subtitle (English)" value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
          <AreaField label="Subtitle (Arabic)" value={hero.subtitleAr} onChange={(v) => setHero({ ...hero, subtitleAr: v })} dir="rtl" />
        </CardContent>
      </Card>

      {/* Platform features */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4 text-brand-600" />
            Platform features ({features.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addFeature}>
            <Plus className="h-4 w-4 me-1" />
            Add feature
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {features.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No features yet. Add one with the button above.
            </p>
          )}
          {features.map((f, idx) => (
            <div key={f.key} className="rounded-xl border p-4 bg-background">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Feature #{idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(f.key)}
                  className="text-muted-foreground hover:text-error"
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <select
                    value={f.icon}
                    onChange={(e) => updateFeature(f.key, { icon: e.target.value })}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div />
                <Field label="Title (English)" value={f.title} onChange={(v) => updateFeature(f.key, { title: v })} />
                <Field label="Title (Arabic)" value={f.titleAr} onChange={(v) => updateFeature(f.key, { titleAr: v })} dir="rtl" />
                <AreaField label="Description (English)" value={f.description} onChange={(v) => updateFeature(f.key, { description: v })} />
                <AreaField label="Description (Arabic)" value={f.descriptionAr} onChange={(v) => updateFeature(f.key, { descriptionAr: v })} dir="rtl" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-brand-600" />
            Closing call-to-action
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Title (English)" value={cta.title} onChange={(v) => setCta({ ...cta, title: v })} />
          <Field label="Title (Arabic)" value={cta.titleAr} onChange={(v) => setCta({ ...cta, titleAr: v })} dir="rtl" />
          <AreaField label="Subtitle (English)" value={cta.subtitle} onChange={(v) => setCta({ ...cta, subtitle: v })} />
          <AreaField label="Subtitle (Arabic)" value={cta.subtitleAr} onChange={(v) => setCta({ ...cta, subtitleAr: v })} dir="rtl" />
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
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="mt-1"
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        rows={3}
        className="mt-1"
      />
    </div>
  );
}
