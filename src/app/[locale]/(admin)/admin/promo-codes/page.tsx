"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PromoCodeForm } from "@/components/admin/PromoCodeForm";
import { formatDate } from "@/lib/utils/formatters";
import type { PromoCodeInput } from "@/lib/utils/validators";

interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  currency: string;
  max_uses?: number;
  current_uses: number;
  min_purchase_amount: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPromoCodesPage() {
  const t = useTranslations("admin");

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function fetchPromoCodes() {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    setPromoCodes((data as PromoCode[]) ?? []);
    setIsLoading(false);
  }

  async function handleSave(data: PromoCodeInput) {
    setIsSaving(true);
    const supabase = createClient();

    const dbData = {
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      currency: data.currency,
      max_uses: data.maxUses ?? null,
      min_purchase_amount: data.minPurchaseAmount,
      starts_at: data.startsAt ?? null,
      expires_at: data.expiresAt ?? null,
      is_active: true,
    };

    const { error } = editingPromo
      ? await supabase
          .from("promo_codes")
          .update(dbData)
          .eq("id", editingPromo.id)
      : await supabase.from("promo_codes").insert(dbData);

    setIsSaving(false);

    if (error) {
      const friendly =
        error.code === "23505"
          ? `A promo code with this code already exists.`
          : error.message;
      toast.error(`Could not save promo code: ${friendly}`);
      return;
    }

    setShowForm(false);
    setEditingPromo(null);
    toast.success(editingPromo ? "Promo code updated" : "Promo code created");
    await fetchPromoCodes();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo code?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Promo code deleted");
    await fetchPromoCodes();
  }

  async function handleToggleActive(promo: PromoCode) {
    const supabase = createClient();
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: !promo.is_active })
      .eq("id", promo.id);
    if (error) {
      toast.error(`Could not update: ${error.message}`);
      return;
    }
    await fetchPromoCodes();
  }

  const columns: Column<PromoCode>[] = [
    {
      key: "code",
      header: "Code",
      render: (item) => (
        <span className="font-mono font-bold">{item.code}</span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (item) => (
        <span>
          {item.discount_type === "percentage"
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
      className: "w-32",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setEditingPromo(item);
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
        <h1 className="font-heading text-2xl font-bold">{t("promoCodes")}</h1>
        <Button
          onClick={() => {
            setEditingPromo(null);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          Create Promo Code
        </Button>
      </div>

      {showForm && (
        <PromoCodeForm
          initialData={
            editingPromo
              ? {
                  code: editingPromo.code,
                  description: editingPromo.description,
                  discountType: editingPromo.discount_type as
                    | "percentage"
                    | "fixed",
                  discountValue: editingPromo.discount_value,
                  currency: editingPromo.currency,
                  maxUses: editingPromo.max_uses ?? undefined,
                  minPurchaseAmount: editingPromo.min_purchase_amount,
                  startsAt: editingPromo.starts_at ?? undefined,
                  expiresAt: editingPromo.expires_at ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingPromo(null);
          }}
          isLoading={isSaving}
        />
      )}

      <Card>
        <CardHeader />
        <CardContent>
          <DataTable
            columns={columns}
            data={promoCodes}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No promo codes yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
