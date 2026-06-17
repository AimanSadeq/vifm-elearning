"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferredLanguage: locale as "en" | "ar",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setError(
            "This email is already registered. Please sign in instead.",
          );
          return;
        }
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(json?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <Link
          href={`/${locale}`}
          className="inline-block font-heading text-2xl font-bold text-brand-600"
        >
          VIFM Academy
        </Link>
        <div className="rounded-md bg-success/10 px-6 py-8">
          <h2 className="font-heading text-xl font-bold text-success">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent you a confirmation link. Please check your inbox and
            click the link to activate your account.
          </p>
        </div>
        <Link
          href={`/${locale}/login`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

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
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {t("registerTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("registerSubtitle")}
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
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-sm text-error">{errors.fullName.message}</p>
          )}
        </div>

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
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+971 50 123 4567"
            autoComplete="tel"
            {...register("phone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-error">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("signUp")
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-brand-600 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
