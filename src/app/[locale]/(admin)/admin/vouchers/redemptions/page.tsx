"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDate } from "@/lib/utils/formatters";

const PAGE_SIZE = 25;

interface RedemptionRow {
  id: string;
  redeemedAt: string;
  voucherCode: string;
  assignedEmail: string | null;
  userEmail: string;
  userName: string;
  courseTitle: string;
}

export default function AdminVoucherRedemptionsPage() {
  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchRedemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchRedemptions() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/voucher-redemptions?page=${page}&pageSize=${PAGE_SIZE}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load redemptions");
      setRows((json.data as RedemptionRow[]) ?? []);
      setTotalCount(json.count ?? 0);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load voucher redemptions"
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  const columns: Column<RedemptionRow>[] = [
    {
      key: "user",
      header: "Delegate",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.userName}</span>
          <span className="text-xs text-muted-foreground">{item.userEmail}</span>
        </div>
      ),
    },
    {
      key: "voucherCode",
      header: "Voucher Code",
      render: (item) => (
        <span className="font-mono text-sm font-semibold">
          {item.voucherCode}
        </span>
      ),
    },
    {
      key: "lock",
      header: "Email-locked",
      render: (item) =>
        item.assignedEmail ? (
          <Badge variant="success" className="font-normal">
            {item.assignedEmail}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Generic</span>
        ),
    },
    {
      key: "course",
      header: "Course",
      render: (item) => <span className="text-sm">{item.courseTitle}</span>,
    },
    {
      key: "redeemedAt",
      header: "Redeemed",
      render: (item) => (
        <span className="text-sm">{formatDate(item.redeemedAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Voucher Redemptions</h1>
        <p className="text-sm text-muted-foreground">
          Who redeemed which voucher, for which course. Email-locked vouchers can
          only be used by the assigned delegate and only once.
        </p>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No voucher redemptions yet."
          />
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
