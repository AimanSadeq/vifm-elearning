"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Eye,
} from "lucide-react";
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
import { useLocale } from "next-intl";
import { computeInvoiceNumber } from "@/lib/utils/invoice";

type InvoiceRow = Payment & {
  user?: { full_name: string; email?: string };
  course?: { title: string };
};

const PAGE_SIZE = 50;

export default function AdminInvoicesPage() {
  const locale = useLocale();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function fetchInvoices() {
      const supabase = createClient();

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("payments")
        .select(
          "*, user:profiles!payments_user_id_fkey(full_name, email), course:courses(title)",
          { count: "exact" }
        )
        .eq("status", "completed")
        .order("paid_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (methodFilter !== "all") {
        query = query.eq("payment_method", methodFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("payment_type", typeFilter);
      }

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `invoice_number.ilike.%${s}%,stripe_session_id.ilike.%${s}%,paytabs_transaction_ref.ilike.%${s}%,bank_reference.ilike.%${s}%`
        );
      }

      const { data, count } = await query;
      // Discard if a newer fetch has superseded this one (rapid filter changes)
      if (cancelled) return;
      setInvoices((data as InvoiceRow[]) ?? []);
      setTotalCount(count ?? 0);
      setIsLoading(false);
    }

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, methodFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns: Column<InvoiceRow>[] = [
    {
      key: "invoice_number",
      header: "Invoice #",
      render: (row) => (
        <span className="font-mono text-xs text-foreground">
          {computeInvoiceNumber(row)}
        </span>
      ),
    },
    {
      key: "paid_at",
      header: "Date",
      render: (row) => (
        <span className="text-sm">
          {formatDate(row.paid_at ?? row.created_at, locale)}
        </span>
      ),
    },
    {
      key: "user",
      header: "Customer",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {row.user?.full_name ?? "—"}
          </p>
          {row.user?.email && (
            <p className="text-xs text-muted-foreground truncate">
              {row.user.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "item",
      header: "Item",
      render: (row) => {
        const meta = (row.metadata ?? {}) as {
          plan_name?: string;
          designation_name?: string;
        };
        if (row.payment_type === "subscription") {
          return (
            <span className="text-sm">
              <span className="rounded bg-brand-50 text-brand-700 px-1.5 py-0.5 text-[10px] font-semibold mr-2">
                SUB
              </span>
              {meta.plan_name ?? "Subscription"}
            </span>
          );
        }
        if (row.payment_type === "designation_renewal") {
          return (
            <span className="text-sm">
              <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold mr-2">
                CERT
              </span>
              {meta.designation_name ?? "Designation renewal"}
            </span>
          );
        }
        return (
          <span className="text-sm truncate block max-w-[260px]">
            {row.course?.title ?? "—"}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-semibold">
          {formatCurrency(row.amount, row.currency, locale)}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Method",
      render: (row) => (
        <Badge variant="outline" className="font-normal">
          {row.payment_method ?? "—"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/${locale}/admin/payments/invoices/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-3.5 w-3.5 me-1" />
              View
            </Button>
          </Link>
          {row.invoice_url && (
            <a
              href={row.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <Download className="h-3.5 w-3.5 me-1" />
                PDF
              </Button>
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Invoices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed payments — receipts, refunds, and invoice exports.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} invoices
        </span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by invoice #, transaction ref, customer..."
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All types</option>
                <option value="course_purchase">Course</option>
                <option value="subscription">Subscription</option>
                <option value="designation_renewal">Designation renewal</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(0);
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All methods</option>
                <option value="stripe">Stripe</option>
                <option value="paytabs">PayTabs</option>
                <option value="mamopay">MamoPay</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="voucher">Voucher</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<InvoiceRow>
            data={invoices}
            columns={columns}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No invoices match your filters."
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t p-3">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
