"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { Payment } from "@/types";
import { OFFICES, SUPPORT_EMAIL } from "@/lib/site-content";
import { computeInvoiceNumber } from "@/lib/utils/invoice";

interface InvoiceData extends Payment {
  user?: { full_name?: string; email?: string } | null;
  course?: { title?: string; price?: number; currency?: string } | null;
}

export default function AdminInvoiceDetailPage() {
  const { paymentId } = useParams() as { paymentId: string };
  const locale = useLocale();

  const [payment, setPayment] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;
    // Reset state so navigating between invoice IDs doesn't briefly show
    // the previous one while the new fetch is in flight.
    setIsLoading(true);
    setPayment(null);
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("payments")
        .select(
          "*, user:profiles!payments_user_id_fkey(full_name, email), course:courses(title, price, currency)"
        )
        .eq("id", paymentId)
        .maybeSingle();
      if (cancelled) return;
      setPayment(data as InvoiceData | null);
      setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link href={`/${locale}/admin/payments/invoices`}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 me-2" />
            Back to invoices
          </Button>
        </Link>
      </div>
    );
  }

  const invoiceNumber = computeInvoiceNumber(payment);
  const issuedAt = payment.paid_at ?? payment.created_at;
  const meta = (payment.metadata ?? {}) as {
    plan_name?: string;
    designation_name?: string;
  };
  const itemName =
    payment.payment_type === "subscription"
      ? `Subscription: ${meta.plan_name ?? "Plan"}`
      : payment.payment_type === "designation_renewal"
        ? `Designation renewal: ${meta.designation_name ?? "Certification"}`
        : payment.course?.title ?? "Course";
  const subtotal = Number(payment.amount) + Number(payment.discount_amount ?? 0);
  const office = OFFICES[0]; // Primary billing office (Dubai)

  return (
    <div className="space-y-4">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href={`/${locale}/admin/payments/invoices`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 me-2" />
            Back to invoices
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {payment.invoice_url && (
            <a
              href={payment.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 me-2" />
                Download PDF
              </Button>
            </a>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
          >
            <Printer className="h-4 w-4 me-2" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Invoice card — print-friendly */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">INVOICE</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {invoiceNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">VIFM Academy</p>
              <p className="text-sm text-muted-foreground">{office.city}</p>
              <p className="text-sm text-muted-foreground">{office.address}</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
          </div>

          {/* Bill to / Date / Status */}
          <div className="grid gap-6 sm:grid-cols-3 border-y py-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bill to
              </p>
              <p className="mt-1 font-medium">
                {payment.user?.full_name ?? "—"}
              </p>
              {payment.user?.email && (
                <p className="text-sm text-muted-foreground">
                  {payment.user.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Issued
              </p>
              <p className="mt-1 font-medium">
                {formatDate(issuedAt, locale)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <Badge
                variant={
                  payment.status === "completed" ? "success" : "secondary"
                }
                className="mt-1"
              >
                {payment.status}
              </Badge>
            </div>
          </div>

          {/* Line items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    Item
                  </th>
                  <th className="text-end py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">{itemName}</td>
                  <td className="py-3 text-end font-mono">
                    {formatCurrency(subtotal, payment.currency, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ms-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">
                {formatCurrency(subtotal, payment.currency, locale)}
              </span>
            </div>
            {Number(payment.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span className="font-mono">
                  -
                  {formatCurrency(
                    Number(payment.discount_amount),
                    payment.currency,
                    locale
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total paid</span>
              <span className="font-mono">
                {formatCurrency(payment.amount, payment.currency, locale)}
              </span>
            </div>
          </div>

          {/* Payment details */}
          <div className="border-t pt-6 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Payment method:{" "}
              </span>
              {payment.payment_method ?? "—"}
            </p>
            {payment.stripe_session_id && (
              <p>
                <span className="font-medium text-foreground">
                  Stripe session:{" "}
                </span>
                <span className="font-mono text-xs">
                  {payment.stripe_session_id}
                </span>
              </p>
            )}
            {payment.paytabs_transaction_ref && (
              <p>
                <span className="font-medium text-foreground">
                  PayTabs ref:{" "}
                </span>
                <span className="font-mono text-xs">
                  {payment.paytabs_transaction_ref}
                </span>
              </p>
            )}
            {payment.bank_reference && (
              <p>
                <span className="font-medium text-foreground">
                  Bank reference:{" "}
                </span>
                <span className="font-mono text-xs">
                  {payment.bank_reference}
                </span>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            <p>Thank you for your business.</p>
            <p className="mt-1">
              Questions? Contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-brand-600 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
