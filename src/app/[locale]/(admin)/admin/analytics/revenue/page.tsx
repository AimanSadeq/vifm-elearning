"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { StatCard } from "@/components/analytics/StatCard";
import { RevenueLineChart } from "@/components/analytics/charts/RevenueLineChart";
import { PaymentMethodPieChart } from "@/components/analytics/charts/PaymentMethodPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/formatters";
import { exportToCSV } from "@/lib/utils/csv-export";

import { fetchAdminProfiles } from "@/lib/api/admin-profiles";
interface MonthlyRevenue {
  month: string;
  revenue: number;
  transactions: number;
}

interface PaymentRow {
  id: string;
  user_email: string;
  course_title: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

export default function RevenueAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgTransaction, setAvgTransaction] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);

  useEffect(() => {
    async function fetchRevenue() {
      const supabase = createClient();

      // Paginate past Supabase's 1000-row cap.
      async function fetchAllCompletedPayments() {
        const pageSize = 1000;
        const all: Array<{
          amount: number | null;
          payment_method: string | null;
          paid_at: string | null;
          created_at: string | null;
        }> = [];
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabase
            .from("payments")
            .select("amount, payment_method, paid_at, created_at")
            .eq("status", "completed")
            .range(from, from + pageSize - 1);
          if (error) {
            reportSupabaseError(error, "Could not load revenue data");
            return all;
          }
          if (!data || data.length === 0) break;
          all.push(...(data as typeof all));
          if (data.length < pageSize) break;
        }
        return all;
      }

      const [payments, { data: recent }] = await Promise.all([
        fetchAllCompletedPayments(),
        supabase
          .from("payments")
          .select(
            `
            id,
            amount,
            payment_method,
            paid_at,
            created_at,
            user_id,
            course:courses!payments_course_id_fkey(title)
          `
          )
          .eq("status", "completed")
          .order("paid_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const total =
        payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;
      const count = payments?.length ?? 0;

      // Use paid_at when present (real Thinkific date), fall back to created_at
      const paymentDate = (p: { paid_at?: string | null; created_at?: string | null }) =>
        p.paid_at ?? p.created_at ?? null;

      setTotalRevenue(total);
      setTransactionCount(count);
      setAvgTransaction(count > 0 ? total / count : 0);

      // Build monthly data
      const monthlyMap = new Map<
        string,
        { revenue: number; transactions: number }
      >();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        monthlyMap.set(key, { revenue: 0, transactions: 0 });
      }

      payments?.forEach((p) => {
        const when = paymentDate(p);
        if (!when) return;
        const d = new Date(when);
        const key = d.toLocaleString("en-US", {
          month: "short",
          year: "2-digit",
        });
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.revenue += p.amount || 0;
          entry.transactions += 1;
        }
      });

      setMonthlyData(
        Array.from(monthlyMap.entries()).map(([month, values]) => ({
          month,
          ...values,
        }))
      );

      // Payment methods
      const methodMap = new Map<string, { count: number; amount: number }>();
      payments?.forEach((p) => {
        const method = p.payment_method || "unknown";
        const entry = methodMap.get(method) || { count: 0, amount: 0 };
        entry.count += 1;
        entry.amount += p.amount || 0;
        methodMap.set(method, entry);
      });
      setPaymentMethods(
        Array.from(methodMap.entries()).map(([method, values]) => ({
          method,
          ...values,
        }))
      );

      // profiles.email is private to `authenticated` and can no longer be
      // embedded; resolve the addresses through the service-role route.
      const emailById = new Map<string, string>();
      const payerIds = [
        ...new Set(
          (recent ?? [])
            .map((p) => (p as Record<string, unknown>).user_id as string)
            .filter(Boolean)
        ),
      ];
      if (payerIds.length) {
        const { rows } = await fetchAdminProfiles({ ids: payerIds, pageSize: payerIds.length });
        rows.forEach((r) => emailById.set(r.id, r.email ?? ""));
      }

      // Recent payments — prefer paid_at for display
      setRecentPayments(
        (recent ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          user_email: emailById.get(p.user_id as string) ?? "",
          course_title:
            ((p.course as Record<string, unknown>)?.title as string) ?? "",
          amount: p.amount as number,
          payment_method: (p.payment_method as string) || "—",
          created_at:
            ((p.paid_at as string) || (p.created_at as string)) ?? "",
        }))
      );

      setIsLoading(false);
    }

    fetchRevenue();
  }, []);

  const paymentColumns: Column<PaymentRow>[] = [
    {
      key: "user",
      header: "User",
      render: (item) => (
        <span className="text-sm">{item.user_email}</span>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (item) => (
        <span className="text-sm font-medium">{item.course_title}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (item) => (
        <span className="text-sm capitalize">{item.payment_method}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Revenue Analytics</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportToCSV(recentPayments, "revenue-data", [
              { key: "user_email", header: "User" },
              { key: "course_title", header: "Course" },
              { key: "amount", header: "Amount" },
              { key: "payment_method", header: "Method" },
              { key: "created_at", header: "Date" },
            ])
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={CreditCard}
          label="Transactions"
          value={transactionCount.toLocaleString()}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Transaction"
          value={formatCurrency(avgTransaction)}
          color="text-brand-600"
          bg="bg-brand-50"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueLineChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodPieChart data={paymentMethods} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={paymentColumns}
            data={recentPayments}
            rowKey={(item) => item.id}
            emptyMessage="No payments yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
