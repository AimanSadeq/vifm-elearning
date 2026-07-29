"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { Webinar } from "@/types";

import { WEBINAR_PUBLIC_COLUMNS } from "@/lib/supabase/columns";
const PAGE_SIZE = 25;

export default function AdminWebinarsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();

  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    async function fetchWebinars() {
      setIsLoading(true);
      const supabase = createClient();

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("webinars")
        .select(
          `
          ${WEBINAR_PUBLIC_COLUMNS},
          instructor:profiles!webinars_instructor_id_fkey(full_name)
        `,
          { count: "exact" }
        )
        .order("scheduled_at", { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (debouncedSearch) {
        const s = escapeIlike(debouncedSearch);
        query = query.or(
          `title.ilike.%${s}%,title_ar.ilike.%${s}%`
        );
      }

      const { data, count } = await query;
      // supabase-js types a foreign-key embed as an array; the Webinar type
      // models `instructor` as a single row. Cast through unknown.
      setWebinars((data as unknown as Webinar[]) ?? []);
      setTotalCount(count ?? 0);
      setIsLoading(false);
    }

    fetchWebinars();
  }, [debouncedSearch, statusFilter, page]);

  const handleDelete = async (webinarId: string) => {
    if (!confirm("Are you sure you want to delete this webinar?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("webinars").delete().eq("id", webinarId);

    if (error) {
      alert("Failed to delete webinar: " + error.message);
      return;
    }

    setWebinars((prev) => prev.filter((w) => w.id !== webinarId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="info">Scheduled</Badge>;
      case "live":
        return <Badge variant="success">Live</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="warning">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: Column<Webinar>[] = [
    {
      key: "title",
      header: "Webinar",
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(item.scheduled_at, locale)}
          </p>
        </div>
      ),
    },
    {
      key: "instructor",
      header: "Instructor",
      render: (item) => (
        <span className="text-sm">
          {(item.instructor as unknown as { full_name: string })?.full_name ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => statusBadge(item.status),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span>
          {item.is_free ? "Free" : formatCurrency(item.price, item.currency)}
        </span>
      ),
    },
    {
      key: "attendees",
      header: "Max Attendees",
      render: (item) => <span>{item.max_attendees ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link href={`/${locale}/webinars/${item.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/webinars/${item.id}/edit`}>
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
          {t("manageWebinars")}
        </h1>
        <Link href={`/${locale}/admin/webinars/new`}>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("createWebinar")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search webinars..."
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center gap-2">
              {["all", "scheduled", "live", "completed", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={webinars}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No webinars found. Create your first webinar!"
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
