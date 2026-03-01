"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Designation } from "@/types";

interface DesignationWithCount extends Designation {
  _holderCount?: number;
}

export default function AdminCertificationsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [designations, setDesignations] = useState<DesignationWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("designations")
        .select("*")
        .order("created_at", { ascending: true });

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `name.ilike.%${s}%,name_ar.ilike.%${s}%,abbreviation.ilike.%${s}%`
        );
      }

      const { data } = await query;
      let list = (data as Designation[]) ?? [];

      // Client-side tier filter (metadata is JSONB)
      if (tierFilter !== "all") {
        list = list.filter(
          (d) => d.metadata?.tier_level === tierFilter
        );
      }

      // Fetch holder counts
      const { data: holders } = await supabase
        .from("designation_holders")
        .select("designation_id")
        .eq("status", "active");

      const countMap: Record<string, number> = {};
      (holders ?? []).forEach((h: { designation_id: string }) => {
        countMap[h.designation_id] = (countMap[h.designation_id] || 0) + 1;
      });

      const enriched: DesignationWithCount[] = list.map((d) => ({
        ...d,
        _holderCount: countMap[d.id] || 0,
      }));

      setDesignations(enriched);
      setIsLoading(false);
    }

    fetchData();
  }, [debouncedSearch, tierFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("designations").delete().eq("id", id);

    if (!error) {
      setDesignations((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleToggleActive = async (item: DesignationWithCount) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("designations")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (!error) {
      setDesignations((prev) =>
        prev.map((d) =>
          d.id === item.id ? { ...d, is_active: !d.is_active } : d
        )
      );
    }
  };

  const tierBadge = (level?: string) => {
    switch (level) {
      case "gateway":
        return <Badge variant="secondary">Gateway</Badge>;
      case "professional":
        return <Badge variant="info">Professional</Badge>;
      case "executive":
        return <Badge variant="warning">Executive</Badge>;
      default:
        return <Badge variant="secondary">—</Badge>;
    }
  };

  const columns: Column<DesignationWithCount>[] = [
    {
      key: "name",
      header: "Certification",
      render: (item) => (
        <div>
          <Link
            href={`/${locale}/admin/certifications/${item.id}/edit`}
            className="font-medium hover:text-primary hover:underline line-clamp-1"
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground">{item.abbreviation}</p>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (item) => tierBadge(item.metadata?.tier_level),
    },
    {
      key: "fee",
      header: "Founding Fee",
      render: (item) => (
        <span className="whitespace-nowrap">
          {item.founding_fee === 0
            ? "Free"
            : formatCurrency(item.founding_fee, item.currency)}
        </span>
      ),
    },
    {
      key: "holders",
      header: "Active Holders",
      render: (item) => <span>{item._holderCount ?? 0}</span>,
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
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/designations/${item.slug}`} title="View public page">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/certifications/${item.id}/edit`} title="Edit">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleToggleActive(item)}
            title={item.is_active ? "Deactivate" : "Activate"}
          >
            {item.is_active ? (
              <ToggleRight className="h-4 w-4 text-success" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-error hover:text-error"
            onClick={() => handleDelete(item.id)}
            title="Delete"
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
        <h1 className="font-heading text-2xl font-bold">
          {t("manageCertifications")}
        </h1>
        <Link href={`/${locale}/admin/certifications/new`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("createCertification")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search certifications..."
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center gap-2">
              {["all", "gateway", "professional", "executive"].map((tier) => (
                <Button
                  key={tier}
                  variant={tierFilter === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTierFilter(tier)}
                >
                  {tier === "all"
                    ? "All"
                    : tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={designations}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No certifications found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
