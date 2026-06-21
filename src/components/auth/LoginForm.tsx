"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VALID_LOCALES = ["en", "ar"];

export function LoginForm() {
  const t = useTranslations("auth");
  const rawLocale = useLocale();
  const locale = VALID_LOCALES.includes(rawLocale) ? rawLocale : "en";
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : `/${locale}/dashboard`;

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoGateTarget, setDemoGateTarget] = useState<{ role: string; path: string } | null>(null);
  const [demoGateView, setDemoGateView] = useState<"login" | "request">("login");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [demoGateError, setDemoGateError] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState("");
  const [reqSuccess, setReqSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      setError(authError.message);
      return;
    }

    // If there's an explicit redirect param, use it; otherwise route by role
    let destination = redirectTo;
    if (!rawRedirect) {
      const role = authData.user?.app_metadata?.role as string | undefined;
      switch (role) {
        case "super_admin":
          destination = `/${locale}/admin/dashboard`;
          break;
        case "instructor":
          destination = `/${locale}/instructor/dashboard`;
          break;
        case "corporate_admin":
          destination = `/${locale}/corporate/dashboard`;
          break;
        default:
          destination = `/${locale}/dashboard`;
      }
    }

    // Full page navigation ensures server-side rendering gets the fresh auth cookies
    window.location.href = destination;
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <Link
          href={`/${locale}`}
          className="inline-block font-heading text-2xl font-bold text-brand-600"
        >
          VIFM Academy
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-bold">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-brand-600 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-error">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("signIn")
          )}
        </Button>
      </form>

      <div className="pt-5 border-t border-border">
        <p className="mb-1 text-center text-[13px] font-bold text-[#2563eb]">
          👁 Try Demo
        </p>
        <p className="mb-3 text-center text-[12px] text-muted-foreground">
          Explore the system with sample data no login required
        </p>
        <div className="flex flex-col gap-2">
          {[
            { role: "super_admin", label: "Admin Demo", sub: "Full View", icon: "🔐", path: "/demo/admin" },
            { role: "instructor", label: "Instructor Demo", sub: "Course Management", icon: "👨‍🏫", path: "/demo/instructor" },
            { role: "learner", label: "Learner Demo", sub: "Personal View", icon: "👤", path: "/demo/learner" },
          ].map(({ role, label, sub, icon, path }) => (
            <button
              key={role}
              type="button"
              onClick={() => setDemoGateTarget({ role, path })}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 hover:bg-muted"
            >
              <span className="text-xl">{icon}</span>
              <div className="flex flex-col">
                <span className="font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {demoGateTarget && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setDemoGateTarget(null); setDemoGateView("login"); } }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">{demoGateView === "login" ? "Login" : "Request a Demo"}</h3>
              <button type="button" onClick={() => { setDemoGateTarget(null); setDemoGateView("login"); }} className="text-2xl leading-none text-gray-500 hover:text-gray-700">&times;</button>
            </div>

            {demoGateView === "login" ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Enter demo credentials to continue.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (demoEmail.trim().toLowerCase() === "demo@viftraining.com" && demoPassword === "demo@2026") {
                      const { role, path } = demoGateTarget;
                      sessionStorage.setItem("elearn-demo", "true");
                      sessionStorage.setItem("elearn-demo-role", role);
                      window.location.href = `/${locale}${path}?demo=true&role=${role}`;
                    } else {
                      setDemoGateError("Invalid credentials. Please contact sales for demo access.");
                    }
                  }}
                  className="space-y-3"
                >
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={demoEmail} onChange={(e) => { setDemoEmail(e.target.value); setDemoGateError(""); }} placeholder="demo@viftraining.com" required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={demoPassword} onChange={(e) => { setDemoPassword(e.target.value); setDemoGateError(""); }} placeholder="••••••••" required />
                  </div>
                  {demoGateError && <p className="text-sm text-red-600">{demoGateError}</p>}
                  <button type="submit" className="w-full py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>Enter Demo</button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Don&apos;t have credentials?{" "}
                  <button type="button" onClick={() => setDemoGateView("request")} className="font-semibold text-[#2563eb] hover:underline">Request a Demo</button>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Tell us about yourself and we&apos;ll get in touch.</p>
                {reqSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-1">✅</div>
                    <div className="font-bold text-emerald-800 mb-1">Request Sent</div>
                    <div className="text-sm text-emerald-700">Thanks our team will reach out shortly.</div>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setReqSubmitting(true);
                      setReqError("");
                      try {
                        const resp = await fetch("https://ops.viftraining.com/api/public/demo-request", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: reqName.trim(),
                            email: reqEmail.trim(),
                            company: reqCompany.trim(),
                            phone: reqPhone.trim(),
                            message: reqMessage.trim(),
                            sourceSystem: "VIFM Academy E-Learning Platform",
                          }),
                        });
                        const data = await resp.json().catch(() => ({}));
                        if (resp.ok && data.success) {
                          setReqSuccess(true);
                          setReqName(""); setReqEmail(""); setReqCompany(""); setReqPhone(""); setReqMessage("");
                        } else {
                          setReqError(data?.error || "Failed to send. Please email clients@viftraining.com directly.");
                        }
                      } catch {
                        setReqError("Network error. Please email clients@viftraining.com directly.");
                      } finally {
                        setReqSubmitting(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>Full Name *</Label>
                      <Input type="text" value={reqName} onChange={(e) => setReqName(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Company *</Label>
                      <Input type="text" value={reqCompany} onChange={(e) => setReqCompany(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input type="tel" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <textarea value={reqMessage} onChange={(e) => setReqMessage(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    {reqError && <div className="text-sm text-red-600">{reqError}</div>}
                    <button
                      type="submit"
                      disabled={reqSubmitting}
                      className="w-full py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                    >
                      {reqSubmitting ? "Sending…" : "Send Request"}
                    </button>
                  </form>
                )}
                <p className="text-center text-sm text-gray-500 mt-4">
                  <button type="button" onClick={() => setDemoGateView("login")} className="font-semibold text-[#2563eb] hover:underline">← Back to Login</button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-brand-600 hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
