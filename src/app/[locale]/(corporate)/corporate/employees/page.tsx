"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatRelativeDate } from "@/lib/utils/formatters";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  enrollment_count?: number;
}

export default function CorporateEmployeesPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchEmployees() {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, last_login_at, created_at")
        .eq("organization_id", user.organization_id)
        .order("full_name");

      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`
        );
      }

      const { data } = await query;
      setEmployees((data as Employee[]) ?? []);
      setIsLoading(false);
    }

    if (!authLoading) fetchEmployees();
  }, [user, authLoading, debouncedSearch]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      render: (item) => (
        <div>
          <p className="font-medium">{item.full_name}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <Badge variant="outline">{item.role.replace("_", " ")}</Badge>
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
      key: "lastLogin",
      header: "Last Login",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.last_login_at
            ? formatRelativeDate(item.last_login_at)
            : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("employees")}</h1>

      <Card>
        <CardHeader>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
            className="w-full sm:max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employees}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No employees found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
