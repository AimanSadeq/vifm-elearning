"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { TablePagination } from "@/components/shared/TablePagination";
import { VoucherForm } from "@/components/admin/VoucherForm";
import { VoucherLinkDialog } from "@/components/admin/VoucherLinkDialog";
import { formatDate } from "@/lib/utils/formatters";
import type { VoucherInput } from "@/lib/utils/validators";
import type { Voucher, VoucherType } from "@/types";

const PAGE_SIZE = 25;

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [linkVoucher, setLinkVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    fetchVouchers();
    // fetchVouchers re-reads `page` via closure on each call — declaring it
    // in deps would re-create the function and trigger an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchVouchers() {
    setIsLoading(true);
    const supabase = createClient();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from("vouchers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      reportSupabaseError(error, "Could not load vouchers");
      setVouchers([]);
      setTotalCount(0);
    } else {
      setVouchers((data as Voucher[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setIsLoading(false);
  }

  async function handleSave(data: VoucherInput) {
    setIsSaving(true);
    const supabase = createClient();

    const dbData = {
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      voucher_type: data.voucherType,
      discount_value:
        data.voucherType === "full_access" ? null : data.discountValue,
      currency: data.currency,
      max_uses: data.isSingleUse ? 1 : (data.maxUses ?? null),
      is_single_use: data.isSingleUse,
      applicable_courses: data.applicableCourses ?? [],
      starts_at: data.startsAt || null,
      expires_at: data.expiresAt || null,
      is_active: true,
    };

    const { error } = editingVoucher
      ? await supabase
          .from("vouchers")
          .update(dbData)
          .eq("id", editingVoucher.id)
      : await supabase.from("vouchers").insert(dbData);

    setIsSaving(false);

    if (error) {
      const friendly =
        error.code === "23505"
          ? "A voucher with this code already exists."
          : error.message;
      toast.error(`Could not save voucher: ${friendly}`);
      return;
    }

    setShowForm(false);
    setEditingVoucher(null);
    toast.success(editingVoucher ? "Voucher updated" : "Voucher created");
    await fetchVouchers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this voucher?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Voucher deleted");
    await fetchVouchers();
  }

  async function handleToggleActive(voucher: Voucher) {
    const supabase = createClient();
    const { error } = await supabase
      .from("vouchers")
      .update({ is_active: !voucher.is_active })
      .eq("id", voucher.id);
    if (error) {
      toast.error(`Could not update: ${error.message}`);
      return;
    }
    await fetchVouchers();
  }

  function getTypeBadge(type: VoucherType) {
    switch (type) {
      case "full_access":
        return <Badge variant="success">Full Access</Badge>;
      case "percentage":
        return <Badge variant="info">Percentage</Badge>;
      case "fixed_amount":
        return <Badge variant="warning">Fixed Amount</Badge>;
    }
  }

  const columns: Column<Voucher>[] = [
    {
      key: "code",
      header: "Code",
      render: (item) => (
        <span className="font-mono font-bold">{item.code}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => getTypeBadge(item.voucher_type),
    },
    {
      key: "discount",
      header: "Discount",
      render: (item) => (
        <span>
          {item.voucher_type === "full_access"
            ? "100% Free"
            : item.voucher_type === "percentage"
              ? `${item.discount_value}%`
              : `${item.discount_value} ${item.currency}`}
        </span>
      ),
    },
    {
      key: "uses",
      header: "Uses",
      render: (item) => (
        <span>
          {item.current_uses}
          {item.max_uses ? ` / ${item.max_uses}` : ""}
          {item.is_single_use && (
            <span className="ml-1 text-xs text-muted-foreground">
              (single)
            </span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) =>
        item.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      key: "expires",
      header: "Expires",
      render: (item) => (
        <span className="text-sm">
          {item.expires_at ? formatDate(item.expires_at) : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-40",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Share checkout link"
            onClick={() => setLinkVoucher(item)}
            disabled={!item.is_active}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setEditingVoucher(item);
              setShowForm(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleToggleActive(item)}
          >
            {item.is_active ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Vouchers</h1>
        <Button
          onClick={() => {
            setEditingVoucher(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          Create Voucher
        </Button>
      </div>

      {showForm && (
        <VoucherForm
          initialData={
            editingVoucher
              ? {
                  id: editingVoucher.id,
                  code: editingVoucher.code,
                  description: editingVoucher.description ?? undefined,
                  voucherType: editingVoucher.voucher_type,
                  discountValue:
                    editingVoucher.discount_value ?? undefined,
                  currency: editingVoucher.currency,
                  maxUses: editingVoucher.max_uses ?? undefined,
                  isSingleUse: editingVoucher.is_single_use,
                  applicableCourses:
                    editingVoucher.applicable_courses ?? [],
                  startsAt: editingVoucher.starts_at ?? undefined,
                  expiresAt: editingVoucher.expires_at ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingVoucher(null);
          }}
          isLoading={isSaving}
        />
      )}

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={vouchers}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No vouchers yet. Create one to get started."
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

      <VoucherLinkDialog
        open={linkVoucher !== null}
        onOpenChange={(open) => {
          if (!open) setLinkVoucher(null);
        }}
        voucher={linkVoucher}
      />
    </div>
  );
}
