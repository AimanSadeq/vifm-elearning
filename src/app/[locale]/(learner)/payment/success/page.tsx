"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type VerifyState =
  | { status: "loading" }
  | {
      status: "completed";
      paymentType: "course_purchase" | "subscription" | "designation_renewal" | null;
      courseSlug: string | null;
    }
  | { status: "pending" }
  | { status: "failed"; message: string };

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const paymentId = params.get("payment_id");

  const [state, setState] = useState<VerifyState>({ status: "loading" });

  useEffect(() => {
    if (!sessionId && !paymentId) {
      setState({ status: "failed", message: "Missing payment reference." });
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8; // ~16s total

    async function poll() {
      attempts += 1;
      const qs = sessionId ? `session_id=${sessionId}` : `payment_id=${paymentId}`;
      try {
        const res = await fetch(`/api/payments/verify?${qs}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (!cancelled) {
            setState({
              status: "failed",
              message: payload.error || "Could not verify payment.",
            });
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "completed") {
          setState({
            status: "completed",
            paymentType: data.paymentType,
            courseSlug: data.courseSlug,
          });
          return;
        }

        if (data.status === "failed" || data.status === "refunded") {
          setState({
            status: "failed",
            message:
              "Payment did not complete. If you were charged, contact support.",
          });
          return;
        }

        // Still pending — webhook hasn't landed yet. Retry with backoff.
        if (attempts < maxAttempts) {
          setTimeout(poll, Math.min(2000, 500 * attempts));
        } else {
          setState({ status: "pending" });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "failed",
            message: "Network error while verifying payment.",
          });
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, paymentId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {state.status === "loading" && (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
              <h1 className="text-2xl font-bold">Verifying your payment…</h1>
              <p className="text-muted-foreground">
                This usually takes a few seconds.
              </p>
            </>
          )}

          {state.status === "completed" && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold">{t("paymentSuccess")}</h1>
              <p className="text-muted-foreground">
                {state.paymentType === "subscription"
                  ? "Your subscription is active. You now have access to all included content."
                  : "Your enrollment has been confirmed. You can now start learning!"}
              </p>
              <div className="flex flex-col gap-3 pt-4">
                {state.paymentType === "subscription" ? (
                  <Link href={`/${locale}/subscription`}>
                    <Button className="w-full" size="lg">
                      Manage Subscription
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={
                      state.courseSlug
                        ? `/${locale}/courses/${state.courseSlug}/learn`
                        : `/${locale}/my-courses`
                    }
                  >
                    <Button className="w-full" size="lg">
                      <BookOpen className="h-4 w-4 me-2" />
                      {tc("startLearning")}
                    </Button>
                  </Link>
                )}
                <Link href={`/${locale}/courses`}>
                  <Button variant="outline" className="w-full">
                    Browse More Courses
                  </Button>
                </Link>
              </div>
            </>
          )}

          {state.status === "pending" && (
            <>
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-amber-500" />
              <h1 className="text-2xl font-bold">Payment received</h1>
              <p className="text-muted-foreground">
                Your payment is still being confirmed by the bank. We&apos;ll
                send you an email as soon as it&apos;s settled — you can also
                check your account in a few minutes.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <Link href={`/${locale}/my-courses`}>
                  <Button className="w-full" size="lg">
                    Go to My Courses
                  </Button>
                </Link>
              </div>
            </>
          )}

          {state.status === "failed" && (
            <>
              <AlertCircle className="mx-auto h-16 w-16 text-error" />
              <h1 className="text-2xl font-bold">We couldn&apos;t confirm this payment</h1>
              <p className="text-muted-foreground">{state.message}</p>
              <div className="flex flex-col gap-3 pt-4">
                <Link href={`/${locale}/courses`}>
                  <Button className="w-full" size="lg">
                    Browse Courses
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
