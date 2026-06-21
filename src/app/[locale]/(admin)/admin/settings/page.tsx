"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Settings,
  Database,
  CreditCard,
  Video,
  Mail,
  Shield,
  Globe,
  CheckCircle,
  XCircle,
  Pencil,
  ArrowRight,
  Wallet,
  LayoutTemplate,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IntegrationStatus {
  supabase: boolean;
  stripe: boolean;
  paytabs: boolean;
  mamopay: boolean;
  mamopay_webhook: boolean;
  mamopay_env: string;
  zoom: boolean;
  email: boolean;
}

interface Integration {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  details?: string;
  badge?: string;
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/integrations/status")
      .then((r) => r.json())
      .then((j) => setStatus(j.data ?? null))
      .catch(() => setStatus(null));
  }, []);

  const integrations: Integration[] = [
    {
      name: "Supabase",
      description: "Database, Auth & Storage",
      icon: <Database className="h-5 w-5" />,
      connected: status?.supabase ?? false,
      details: "PostgreSQL + Row Level Security",
    },
    {
      name: "Stripe",
      description: "Payment processing",
      icon: <CreditCard className="h-5 w-5" />,
      connected: status?.stripe ?? false,
      details: "Cards, invoices, subscriptions",
    },
    {
      name: "PayTabs",
      description: "Regional payment gateway",
      icon: <CreditCard className="h-5 w-5" />,
      connected: status?.paytabs ?? false,
      details: "GCC payment methods",
    },
    {
      name: "MamoPay",
      description: "UAE payment gateway",
      icon: <Wallet className="h-5 w-5" />,
      connected: status?.mamopay ?? false,
      details: status?.mamopay
        ? `Cards · Apple Pay · ${status.mamopay_env === "production" ? "Live" : "Sandbox"}${
            status.mamopay_webhook ? " · Webhook signed" : " · Webhook unsigned (fallback active)"
          }`
        : "Cards · Apple Pay · Tabby for UAE businesses",
    },
    {
      name: "Zoom",
      description: "Webinar hosting",
      icon: <Video className="h-5 w-5" />,
      connected: status?.zoom ?? false,
      details: "Live webinars & recordings",
    },
    {
      name: "Microsoft Outlook",
      description: "Email delivery",
      icon: <Mail className="h-5 w-5" />,
      connected: status?.email ?? false,
      details: "Transactional & marketing emails",
    },
  ];

  const featureToggles = [
    { name: "Discussion Forums", enabled: true },
    { name: "Certificates", enabled: true },
    { name: "Promo Codes", enabled: true },
    { name: "Corporate Licenses", enabled: true },
    { name: "Quiz System", enabled: true },
    { name: "Webinars", enabled: true },
    { name: "Multi-language (EN/AR)", enabled: true },
    { name: "Dark Mode", enabled: true },
  ];

  const platformInfo = [
    { label: "Framework", value: "Next.js 15 (App Router)" },
    { label: "Database", value: "Supabase (PostgreSQL)" },
    { label: "Styling", value: "Tailwind CSS" },
    { label: "Auth", value: "Supabase Auth" },
    { label: "Locales", value: "English, Arabic" },
    { label: "Default Currency", value: "USD" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("settings")}</h1>

      {/* Site Content — editable by admins */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/${locale}/admin/settings/site-content`}
          className="group block rounded-xl border bg-card p-5 hover:border-brand-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold group-hover:text-brand-700 transition-colors">
                  Site content
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Office locations + support email.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/settings/home-content`}
          className="group block rounded-xl border bg-card p-5 hover:border-brand-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold group-hover:text-brand-700 transition-colors">
                  Home content
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marketing hero, platform feature cards + closing CTA (app & web).
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/settings/platform`}
          className="group block rounded-xl border bg-card p-5 hover:border-brand-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold group-hover:text-brand-700 transition-colors">
                  Platform settings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email sender + templates, quiz defaults, homepage stats, app badges, tiers.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformInfo.map((info) => (
              <div key={info.label}>
                <p className="text-sm text-muted-foreground">{info.label}</p>
                <p className="font-medium">{info.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between rounded-lg border p-4 gap-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {integration.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.description}
                    </p>
                    {integration.details && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {integration.details}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={integration.connected ? "success" : "secondary"}
                  className="flex items-center gap-1 shrink-0"
                >
                  {integration.connected ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {integration.connected ? "Connected" : "Not Configured"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Feature Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featureToggles.map((feature) => (
              <div
                key={feature.name}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <span className="text-sm">{feature.name}</span>
                <Badge variant={feature.enabled ? "success" : "secondary"}>
                  {feature.enabled ? "On" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
