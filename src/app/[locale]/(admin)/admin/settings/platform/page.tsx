"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Mail,
  Smartphone,
  Layers,
  ListChecks,
  BarChart3,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface HomeStat {
  key: string;
  value: string;
  label: string;
  labelAr?: string;
}

interface DesignationTierRow {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  accentColor: string;
  gradient: string;
  badgeColor: string;
}

interface EmailTemplateRow {
  key: string;
  name?: string;
  subject: string;
  html: string;
}

const ICON_OPTIONS = ["GraduationCap", "Briefcase", "Crown", "Award"];

const SETTING_KEYS = [
  "email_from",
  "default_quiz_passing_score",
  "default_quiz_max_attempts",
  "homepage_stats",
  "footer_app_store_url",
  "footer_google_play_url",
  "designation_tiers",
  "email_templates",
] as const;

export default function AdminPlatformSettingsPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [emailFrom, setEmailFrom] = useState("");
  const [quizPassingScore, setQuizPassingScore] = useState("70");
  const [quizMaxAttempts, setQuizMaxAttempts] = useState("3");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [googlePlayUrl, setGooglePlayUrl] = useState("");
  const [stats, setStats] = useState<HomeStat[]>([]);
  const [tiers, setTiers] = useState<DesignationTierRow[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", SETTING_KEYS as unknown as string[]);
      const map = new Map<string, unknown>();
      for (const row of data ?? []) map.set(row.key as string, row.value);

      setEmailFrom(strOrEmpty(map.get("email_from")));
      setQuizPassingScore(numOrDefault(map.get("default_quiz_passing_score"), 70).toString());
      setQuizMaxAttempts(numOrDefault(map.get("default_quiz_max_attempts"), 3).toString());
      setAppStoreUrl(strOrEmpty(map.get("footer_app_store_url")));
      setGooglePlayUrl(strOrEmpty(map.get("footer_google_play_url")));
      setStats(Array.isArray(map.get("homepage_stats")) ? (map.get("homepage_stats") as HomeStat[]) : []);
      setTiers(Array.isArray(map.get("designation_tiers")) ? (map.get("designation_tiers") as DesignationTierRow[]) : []);
      setTemplates(Array.isArray(map.get("email_templates")) ? (map.get("email_templates") as EmailTemplateRow[]) : []);
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const rows = [
        { key: "email_from", value: emailFrom },
        { key: "default_quiz_passing_score", value: Math.max(0, Math.min(100, parseInt(quizPassingScore, 10) || 70)) },
        { key: "default_quiz_max_attempts", value: Math.max(1, parseInt(quizMaxAttempts, 10) || 3) },
        { key: "footer_app_store_url", value: appStoreUrl },
        { key: "footer_google_play_url", value: googlePlayUrl },
        { key: "homepage_stats", value: stats },
        { key: "designation_tiers", value: tiers },
        { key: "email_templates", value: templates },
      ];
      const { error: err } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });
      if (err) throw err;
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/settings`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          Back to Settings
        </Link>
        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold">Platform settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit values that used to require a code deploy — sender,
              quiz defaults, marketing copy, tiers, email templates.
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
              {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
              {saving ? "Saving..." : "Save all"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}
      </div>

      {/* Email sender */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-brand-600" />
            Email sender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>From address</Label>
          <Input
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            placeholder='VIFM Academy <noreply@learn.viftraining.com>'
            className="mt-1"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Used as the &quot;From&quot; on all transactional emails. Format:{" "}
            <code className="rounded bg-muted px-1">Name &lt;email@domain&gt;</code>.
          </p>
        </CardContent>
      </Card>

      {/* Quiz defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-brand-600" />
            Quiz defaults (for new quizzes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Passing score (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quizPassingScore}
                onChange={(e) => setQuizPassingScore(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                min={1}
                value={quizMaxAttempts}
                onChange={(e) => setQuizMaxAttempts(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Applied to newly created quizzes. Existing quizzes keep their own values.
          </p>
        </CardContent>
      </Card>

      {/* Homepage stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-600" />
              Homepage stats ({stats.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setStats([
                  ...stats,
                  { key: `stat-${Math.random().toString(36).slice(2, 6)}`, value: "", label: "", labelAr: "" },
                ])
              }
            >
              <Plus className="h-4 w-4 me-1" />
              Add stat
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.length === 0 && (
            <p className="text-sm text-muted-foreground">No stats configured.</p>
          )}
          {stats.map((stat, i) => (
            <div key={stat.key} className="rounded-lg border p-3">
              <div className="grid gap-2 sm:grid-cols-[100px_1fr_1fr_1fr_auto]">
                <div>
                  <Label className="text-xs">Key</Label>
                  <Input
                    value={stat.key}
                    onChange={(e) => updateStat(i, { key: e.target.value })}
                    placeholder="learners"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(i, { value: e.target.value })}
                    placeholder="10,000+"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label (EN)</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(i, { label: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Label (AR)</Label>
                  <Input
                    value={stat.labelAr ?? ""}
                    dir="rtl"
                    onChange={(e) => updateStat(i, { labelAr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error"
                    onClick={() => setStats(stats.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Icons resolve automatically by <code>key</code>: <em>learners, courses, certificates, instructors, organizations, countries</em>.
          </p>
        </CardContent>
      </Card>

      {/* App badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-brand-600" />
            Mobile app footer badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>App Store URL</Label>
              <Input
                value={appStoreUrl}
                onChange={(e) => setAppStoreUrl(e.target.value)}
                placeholder="https://apps.apple.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Google Play URL</Label>
              <Input
                value={googlePlayUrl}
                onChange={(e) => setGooglePlayUrl(e.target.value)}
                placeholder="https://play.google.com/..."
                className="mt-1"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Leave both blank to hide the &quot;Get the App&quot; section entirely.
          </p>
        </CardContent>
      </Card>

      {/* Designation tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-600" />
              Designation tiers ({tiers.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTiers([
                  ...tiers,
                  {
                    id: `tier-${Math.random().toString(36).slice(2, 6)}`,
                    label: "",
                    labelAr: "",
                    description: "",
                    descriptionAr: "",
                    icon: "GraduationCap",
                    accentColor: "#10b981",
                    gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
                    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 me-1" />
              Add tier
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The tier <code>id</code> must match the values stored on courses (<em>gateway, professional, executive</em>) — changing it disconnects the tier from existing course rows.
          </p>
          {tiers.map((tier, i) => (
            <div key={tier.id + i} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{tier.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error"
                  onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4 me-1" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">ID (matches course.tier_level)</Label>
                  <Input value={tier.id} onChange={(e) => updateTier(i, { id: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Icon</Label>
                  <select
                    value={tier.icon}
                    onChange={(e) => updateTier(i, { icon: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    {ICON_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Label (EN)</Label>
                  <Input value={tier.label} onChange={(e) => updateTier(i, { label: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Label (AR)</Label>
                  <Input dir="rtl" value={tier.labelAr} onChange={(e) => updateTier(i, { labelAr: e.target.value })} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Description (EN)</Label>
                  <Textarea
                    rows={2}
                    value={tier.description}
                    onChange={(e) => updateTier(i, { description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Description (AR)</Label>
                  <Textarea
                    rows={2}
                    dir="rtl"
                    value={tier.descriptionAr}
                    onChange={(e) => updateTier(i, { descriptionAr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Accent colour (hex)</Label>
                  <Input value={tier.accentColor} onChange={(e) => updateTier(i, { accentColor: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Gradient (Tailwind)</Label>
                  <Input value={tier.gradient} onChange={(e) => updateTier(i, { gradient: e.target.value })} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Badge classes (Tailwind)</Label>
                  <Input value={tier.badgeColor} onChange={(e) => updateTier(i, { badgeColor: e.target.value })} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-brand-600" />
            Email templates ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Subject + HTML for each transactional email. Use <code>{`{{placeholder}}`}</code> for substitution. Available per template:
            <br />
            <strong>enrollment_confirmation</strong>: userName, courseName, appUrl <br />
            <strong>webinar_reminder</strong>: userName, webinarTitle, scheduledAt, joinUrl
          </p>
          {templates.map((tpl, i) => (
            <div key={tpl.key + i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{tpl.key}</span>
                <span className="text-xs text-muted-foreground">{tpl.name ?? ""}</span>
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  value={tpl.subject}
                  onChange={(e) => updateTemplate(i, { subject: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">HTML body</Label>
                <Textarea
                  rows={6}
                  value={tpl.html}
                  onChange={(e) => updateTemplate(i, { html: e.target.value })}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
          {saving ? "Saving..." : "Save all"}
        </Button>
      </div>
    </div>
  );

  function updateStat(idx: number, patch: Partial<HomeStat>) {
    setStats(stats.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function updateTier(idx: number, patch: Partial<DesignationTierRow>) {
    setTiers(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }
  function updateTemplate(idx: number, patch: Partial<EmailTemplateRow>) {
    setTemplates(templates.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }
}

function strOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function numOrDefault(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
