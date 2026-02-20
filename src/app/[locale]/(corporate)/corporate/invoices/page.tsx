"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function CorporateInvoicesPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("payments")
        .select(
          "id, invoice_number, amount, currency, status, payment_method, invoice_url, paid_at, created_at"
        )
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

      setInvoices((data as InvoiceRow[]) ?? []);
      setIsLoading(false);
    }

    if (!authLoading) fetchInvoices();
  }, [user, authLoading]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "failed":
        return "destructive" as const;
      case "refunded":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const columns: Column<InvoiceRow>[] = [
    {
      key: "invoice",
      header: "Invoice #",
      render: (item) => (
        <span className="font-medium font-mono text-sm">
          {item.invoice_number || `INV-${item.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-sm">
          {formatDate(item.paid_at || item.created_at)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => (
        <span className="font-medium">
          {formatCurrency(item.amount, item.currency)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (item) => (
        <Badge variant="outline">
          {item.payment_method.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) =>
        item.invoice_url ? (
          <a
            href={item.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 me-1" />
              Download
            </Button>
          </a>
        ) : null,
    },
  ];

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("invoices")}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invoices}
            rowKey={(item) => item.id}
            emptyMessage="No invoices found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
