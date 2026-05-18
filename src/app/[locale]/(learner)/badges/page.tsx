"use client";

import { useEffect, useState } from "react";
import { Trophy, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";

interface EarnedBadge {
  verification_id: string;
  template_id: string;
  template_name?: string;
  badge_name?: string;
  template_title?: string; // legacy
  status: "pending" | "active" | "revoked" | "expired";
  issued_at?: string;
  image_url?: string;
}

function badgeLabel(b: EarnedBadge): string {
  return b.badge_name || b.template_name || b.template_title || "Badge";
}

export default function MyBadgesPage() {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/learner/badges")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setEnabled(j.enabled !== false);
        setBadges(j.data ?? []);
        setError(j.error ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load badges");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const verifyBase = process.env.NEXT_PUBLIC_BADGES_PUBLIC_URL;
  const visible = badges.filter((b) => b.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Badges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifiable digital credentials you&apos;ve earned. Share the
          verification link on LinkedIn or from your CV.
        </p>
      </div>

      {!enabled && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-200">
            Badges aren&apos;t configured on this site yet — your future
            completed courses will appear here once they are.
          </CardContent>
        </Card>
      )}

      {enabled && error && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="py-4 text-sm text-red-900 dark:text-red-200">
            Could not load badges: {error}. Try refreshing.
          </CardContent>
        </Card>
      )}

      {enabled && !error && visible.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
              <Trophy className="h-8 w-8 text-warning" />
            </div>
            <p className="font-medium">No badges yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Complete a course that has a badge attached and it&apos;ll show up
              here automatically. Required surveys must be submitted too.
            </p>
          </CardContent>
        </Card>
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => {
            const verifyUrl =
              verifyBase &&
              `${verifyBase.replace(/\/+$/, "")}/verify/${encodeURIComponent(b.verification_id)}`;
            return (
              <Card key={b.verification_id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-4">
                    {b.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.image_url}
                        alt={badgeLabel(b)}
                        className="h-20 w-20 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-warning/10">
                        <Trophy className="h-10 w-10 text-warning" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-snug">
                        {badgeLabel(b)}
                      </p>
                      {b.issued_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Issued{" "}
                          {new Date(b.issued_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {verifyUrl && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Verify
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
