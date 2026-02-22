"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { Payment } from "@/types";

type PaymentRow = Payment & {
  user?: { full_name: string };
  course?: { title: string };
};

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchPayments() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("payments")
        .select(
          "*, user:profiles!payments_user_id_fkey(full_name), course:courses(title)"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `transaction_id.ilike.%${s}%`
        );
      }

      const { data } = await query;
      setPayments((data as PaymentRow[]) ?? []);
      setIsLoading(false);
    }

    fetchPayments();
  }, [debouncedSearch, statusFilter]);

  const handleConfirmBankTransfer = async (paymentId: string) => {
    if (!confirm("Confirm this bank transfer and create enrollment?")) return;

    const res = await fetch(`/api/payments/${paymentId}/confirm`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status: "completed" } : p
        )
      );
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: Column<PaymentRow>[] = [
    {
      key: "user",
      header: "User",
      render: (item) => <span>{item.user?.full_name ?? "—"}</span>,
    },
    {
      key: "course",
      header: "Course",
      render: (item) => (
        <span className="max-w-[200px] truncate block">
          {item.course?.title ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => (
        <span>{formatCurrency(item.amount, item.currency)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (item) => (
        <Badge variant="secondary">
          {item.payment_method?.replace("_", " ") ?? "—"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => statusBadge(item.status),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-sm">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (item) =>
        item.status === "pending" &&
        item.payment_method === "bank_transfer" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Confirm bank transfer"
            onClick={() => handleConfirmBankTransfer(item.id)}
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("managePayments")}
      </h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by transaction ID..."
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center gap-2">
              {["all", "pending", "completed", "failed", "refunded"].map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "all"
                      ? "All"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payments}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No payments found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
