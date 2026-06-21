"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Trophy,
  ExternalLink,
  Loader2,
  ShieldOff,
  Send,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface BadgeTemplate {
  id: string;
  external_id?: string;
  name: string;
  title?: string; // legacy alias
  tier?: string;
  category?: string;
  image_url?: string;
  preview_url?: string;
}

interface IssuedBadge {
  id: string;
  verification_id: string;
  template_id: string;
  template_name?: string;
  badge_name?: string;
  template_title?: string; // legacy
  delegate_external_id?: string;
  delegate_name?: string;
  status: "pending" | "active" | "revoked" | "expired";
  issued_at?: string;
  image_url?: string;
}

// Display helpers — fall through legacy → primary so a template missing one
// field still renders something sensible.
function tplLabel(t: BadgeTemplate): string {
  return t.name || t.title || `(${t.tier ?? "untitled"})`;
}
function badgeLabel(b: IssuedBadge): string {
  return b.badge_name || b.template_name || b.template_title || b.template_id;
}

interface CourseAssignment {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string | null;
  badge_template_external_id: string | null;
}

interface ProfileOption {
  id: string;
  full_name: string;
  email: string;
}

interface CourseOption {
  id: string;
  title: string;
}

type Tab = "templates" | "assignments" | "issued" | "manual";

const TABS: { key: Tab; label: string }[] = [
  { key: "templates", label: "Templates" },
  { key: "assignments", label: "Course Assignments" },
  { key: "issued", label: "Issued Badges" },
  { key: "manual", label: "Manual Issue" },
];

export default function AdminBadgesPage() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<Tab>("templates");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("badges")}</h1>
      </div>

      {enabled === false && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Badges integration is not configured.
              </p>
              <p className="text-amber-800/80 dark:text-amber-200/70 mt-1">
                Set <code className="rounded bg-amber-500/20 px-1">BADGES_API_BASE_URL</code>,{" "}
                <code className="rounded bg-amber-500/20 px-1">BADGES_API_KEY</code>, and{" "}
                <code className="rounded bg-amber-500/20 px-1">NEXT_PUBLIC_BADGES_PUBLIC_URL</code> in
                your environment. Then issue an API key from the VIFM Digital Badges admin UI.
              </p>
              {configError && (
                <p className="mt-1 text-xs text-amber-700/80">{configError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto border-b border-border">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            onClick={() => setTab(tabDef.key)}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === tabDef.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabDef.label}
          </button>
        ))}
      </nav>

      {tab === "templates" && (
        <TemplatesTab
          onEnabledChange={setEnabled}
          onConfigErrorChange={setConfigError}
        />
      )}
      {tab === "assignments" && <AssignmentsTab />}
      {tab === "issued" && <IssuedTab />}
      {tab === "manual" && <ManualIssueTab />}
    </div>
  );
}

function TemplatesTab({
  onEnabledChange,
  onConfigErrorChange,
}: {
  onEnabledChange: (v: boolean) => void;
  onConfigErrorChange: (v: string | null) => void;
}) {
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/badges/templates")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed to load templates");
        onEnabledChange(Boolean(j.enabled));
        onConfigErrorChange(j.error ?? null);
        setTemplates(j.data ?? []);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setIsLoading(false));
  }, [onEnabledChange, onConfigErrorChange]);

  if (isLoading) return <CenterSpinner />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Badge Templates ({templates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates available. Create them in the VIFM Digital Badges admin UI, then refresh.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  {tpl.image_url || tpl.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tpl.image_url ?? tpl.preview_url}
                      alt={tplLabel(tpl)}
                      className="h-16 w-16 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-warning/10">
                      <Trophy className="h-8 w-8 text-warning" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tplLabel(tpl)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                      {tpl.id}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.tier && (
                        <Badge variant="secondary" className="text-[10px]">
                          {tpl.tier}
                        </Badge>
                      )}
                      {tpl.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {tpl.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AssignmentsTab() {
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [coursesRes, templatesRes] = await Promise.all([
        fetch("/api/admin/badges/assignments").then((r) => r.json()),
        fetch("/api/admin/badges/templates").then((r) => r.json()),
      ]);
      setCourses(coursesRes.data ?? []);
      setTemplates(templatesRes.data ?? []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateAssignment = async (
    courseId: string,
    templateExternalId: string | null
  ) => {
    setSavingId(courseId);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({ badge_template_external_id: templateExternalId })
      .eq("id", courseId);
    setSavingId(null);
    if (error) {
      toast.error(`Could not save: ${error.message}`);
      return;
    }
    toast.success("Assignment updated");
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, badge_template_external_id: templateExternalId }
          : c
      )
    );
  };

  if (isLoading) return <CenterSpinner />;

  const columns: Column<CourseAssignment>[] = [
    {
      key: "title",
      header: "Course",
      render: (c) => (
        <div>
          <p className="font-medium text-sm">{c.title}</p>
          {c.title_ar && (
            <p className="text-xs text-muted-foreground" dir="rtl">
              {c.title_ar}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "template",
      header: "Badge Template",
      render: (c) => (
        <select
          value={c.badge_template_external_id ?? ""}
          onChange={(e) =>
            updateAssignment(c.id, e.target.value === "" ? null : e.target.value)
          }
          disabled={savingId === c.id}
          className="block w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value=""> None </option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tplLabel(tpl)}
              {tpl.tier ? ` ${tpl.tier}` : ""}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Course → Badge Template Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length === 0 && (
          <p className="mb-3 text-xs text-amber-600">
            No templates loaded assignments will be empty until templates are
            configured in the badges service.
          </p>
        )}
        <DataTable
          columns={columns}
          data={courses}
          rowKey={(c) => c.id}
          emptyMessage="No courses yet"
        />
      </CardContent>
    </Card>
  );
}

function IssuedTab() {
  const [badges, setBadges] = useState<IssuedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/badges/issued?pageSize=100");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setBadges(j.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoke = async (b: IssuedBadge) => {
    if (!confirm(`Revoke badge for ${b.delegate_name ?? b.delegate_external_id ?? "this user"}?`)) {
      return;
    }
    setRevokingId(b.verification_id);
    const res = await fetch("/api/admin/badges/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId: b.verification_id }),
    });
    const j = await res.json();
    setRevokingId(null);
    if (!res.ok) {
      toast.error(j.error ?? "Failed to revoke");
      return;
    }
    toast.success("Badge revoked");
    load();
  };

  if (isLoading) return <CenterSpinner />;

  const verifyBase = process.env.NEXT_PUBLIC_BADGES_PUBLIC_URL;

  const columns: Column<IssuedBadge>[] = [
    {
      key: "delegate",
      header: "Recipient",
      render: (b) => (
        <div>
          <p className="text-sm font-medium">
            {b.delegate_name ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {b.delegate_external_id ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "template",
      header: "Template",
      render: (b) => (
        <span className="text-sm">{badgeLabel(b)}</span>
      ),
    },
    {
      key: "issued",
      header: "Issued",
      render: (b) => (
        <span className="text-xs text-muted-foreground">
          {b.issued_at ? new Date(b.issued_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Badge
          variant={
            b.status === "active"
              ? "success"
              : b.status === "revoked"
                ? "destructive"
                : "secondary"
          }
        >
          {b.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (b) => (
        <div className="flex items-center gap-1">
          {verifyBase && (
            <a
              href={`${verifyBase.replace(/\/+$/, "")}/verify/${encodeURIComponent(b.verification_id)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Verify"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {b.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRevoke(b)}
              disabled={revokingId === b.verification_id}
            >
              {revokingId === b.verification_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4 text-error" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Issued Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={badges}
          rowKey={(b) => b.verification_id}
          emptyMessage="No badges issued yet"
        />
      </CardContent>
    </Card>
  );
}

function ManualIssueTab() {
  const [users, setUsers] = useState<ProfileOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const [usersRes, coursesRes, templatesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .order("full_name", { ascending: true })
          .limit(500),
        supabase
          .from("courses")
          .select("id, title")
          .order("title", { ascending: true }),
        fetch("/api/admin/badges/templates").then((r) => r.json()),
      ]);
      setUsers((usersRes.data as ProfileOption[]) ?? []);
      setCourses((coursesRes.data as CourseOption[]) ?? []);
      setTemplates(templatesRes.data ?? []);
      setIsLoading(false);
    })();
  }, []);

  const handleIssue = async () => {
    if (!userId || !courseId) {
      toast.error("Pick a user and a course");
      return;
    }
    setIsSubmitting(true);
    const res = await fetch("/api/admin/badges/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        courseId,
        templateExternalId: templateId || undefined,
      }),
    });
    const j = await res.json();
    setIsSubmitting(false);
    if (!res.ok) {
      toast.error(j.error ?? "Failed to issue");
      return;
    }
    toast.success("Badge issued");
    setUserId("");
    setCourseId("");
    setTemplateId("");
  };

  if (isLoading) return <CenterSpinner />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Issue a Badge Manually</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Idempotent re-submitting the same user+course returns the existing
          badge rather than issuing a duplicate.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>User</Label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value=""> Select user </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Course</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value=""> Select course </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Template override (optional)</Label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value=""> Use template assigned to the course </option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tplLabel(tpl)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleIssue} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Send className="h-4 w-4 me-2" />
            )}
            Issue Badge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CenterSpinner() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
