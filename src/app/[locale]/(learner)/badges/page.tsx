"use client";

import { useEffect, useState } from "react";
import { Trophy, Eye, Share2, Download } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Native share sheet when available; otherwise copy the link (or open it).
  async function shareBadge(b: EarnedBadge, url: string) {
    const data = {
      title: badgeLabel(b),
      text: `I earned the ${badgeLabel(b)} badge on VIFM Academy.`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(b.verification_id);
      setTimeout(
        () => setCopiedId((id) => (id === b.verification_id ? null : id)),
        2000,
      );
    } catch {
      window.open(url, "_blank", "noopener");
    }
  }

  // Download through a same-origin proxy that streams the badge image with an
  // attachment header — works even when the badge host doesn't send CORS.
  function downloadBadge(b: EarnedBadge) {
    const a = document.createElement("a");
    a.href = `/api/learner/badges/image?vid=${encodeURIComponent(b.verification_id)}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

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
            Badges aren&apos;t configured on this site yet your future
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
            // The list API often omits image_url, so fall back to the badge
            // service's canonical image endpoint built from the verification id.
            const imageSrc =
              b.image_url ||
              (verifyBase
                ? `${verifyBase.replace(/\/+$/, "")}/api/verify/${encodeURIComponent(b.verification_id)}/image`
                : null);
            const viewUrl = verifyUrl || imageSrc;
            return (
              <Card key={b.verification_id}>
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={badgeLabel(b)}
                      className="h-40 w-40 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-warning/10">
                      <Trophy className="h-14 w-14 text-warning" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold leading-snug">{badgeLabel(b)}</p>
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

                  <div className="mt-1 flex w-full flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!viewUrl}
                      onClick={() =>
                        viewUrl && window.open(viewUrl, "_blank", "noopener")
                      }
                    >
                      <Eye className="h-3.5 w-3.5 me-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!viewUrl}
                      onClick={() => viewUrl && shareBadge(b, viewUrl)}
                    >
                      <Share2 className="h-3.5 w-3.5 me-1.5" />
                      {copiedId === b.verification_id ? "Copied!" : "Share"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!imageSrc}
                      onClick={() => downloadBadge(b)}
                    >
                      <Download className="h-3.5 w-3.5 me-1.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
