"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
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
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {t("resetPassword")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("resetPasswordSubtitle")}
        </p>
      </div>

      {success ? (
        <div className="rounded-md bg-success/10 px-6 py-8 text-center">
          <p className="text-sm font-medium text-success">
            {t("resetLinkSent")}
          </p>
        </div>
      ) : (
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("sendResetLink")
            )}
          </Button>
        </form>
      )}

      {/* Back to login */}
      <div className="text-center">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
