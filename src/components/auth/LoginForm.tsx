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
  const [showDemoGate, setShowDemoGate] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [demoGateError, setDemoGateError] = useState("");

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
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Or explore with sample data
        </p>
        <button
          type="button"
          onClick={() => setShowDemoGate(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        >
          <span>🎓</span>
          <span>Try Demo</span>
        </button>
      </div>

      {showDemoGate && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowDemoGate(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Request a Demo</h3>
              <button type="button" onClick={() => setShowDemoGate(false)} className="text-2xl leading-none text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter demo credentials to continue.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (demoEmail.trim().toLowerCase() === "demo@viftraining.com" && demoPassword === "demo@2026") {
                  sessionStorage.setItem("elearn-demo", "true");
                  sessionStorage.setItem("elearn-demo-role", "learner");
                  window.location.href = `/${locale}/courses?demo=true`;
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
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                Enter Demo
              </button>
            </form>
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
