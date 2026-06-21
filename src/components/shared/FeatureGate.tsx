"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

/**
 * Route guard for admin-gated features. Renders children only when the flag is
 * on; otherwise redirects (no content flash). Used in layout.tsx files so a
 * disabled feature is unreachable, not just hidden from the nav.
 */
export function FeatureGate({
  flag,
  redirectTo = "/dashboard",
  children,
}: {
  flag: "subscriptions" | "learningPaths";
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const flags = useFeatureFlags();
  const router = useRouter();
  const locale = useLocale();
  const enabled = flags[flag];

  useEffect(() => {
    if (!flags.isLoading && !enabled) {
      router.replace(`/${locale}${redirectTo}`);
    }
  }, [flags.isLoading, enabled, router, locale, redirectTo]);

  if (flags.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!enabled) return null; // redirecting
  return <>{children}</>;
}
