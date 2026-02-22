"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Organization } from "@/types";

export default function AdminOrganizationsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchOrgs() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `name.ilike.%${s}%,name_ar.ilike.%${s}%`
        );
      }

      const { data } = await query;
      setOrganizations((data as Organization[]) ?? []);
      setIsLoading(false);
    }

    fetchOrgs();
  }, [debouncedSearch]);

  const handleDelete = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);

    if (!error) {
      setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organization",
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{item.name}</p>
          {item.domain && (
            <p className="text-xs text-muted-foreground">{item.domain}</p>
          )}
        </div>
      ),
    },
    {
      key: "license",
      header: "License",
      render: (item) => (
        <Badge variant="outline">{item.license_type || "per_seat"}</Badge>
      ),
    },
    {
      key: "seats",
      header: "Seats",
      render: (item) => <span>{item.max_seats || "—"}</span>,
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
      header: "",
      className: "w-20",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/admin/organizations/${item.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-error hover:text-error"
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
        <h1 className="font-heading text-2xl font-bold">
          {t("manageOrganizations")}
        </h1>
        <Link href={`/${locale}/admin/organizations/new`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            Create Organization
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search organizations..."
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={organizations}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No organizations found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
