"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatRelativeDate } from "@/lib/utils/formatters";
import type { Profile, UserRole } from "@/types";

type UserRow = Pick<
  Profile,
  "id" | "full_name" | "email" | "role" | "is_active" | "last_login_at" | "created_at"
>;

const ROLE_FILTER_OPTIONS: UserRole[] = [
  "super_admin",
  "instructor",
  "corporate_admin",
  "learner",
];

export default function AdminUsersPage() {
  const t = useTranslations("admin");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active, last_login_at, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`
        );
      }

      const { data } = await query;
      setUsers((data as UserRow[]) ?? []);
      setIsLoading(false);
    }

    fetchUsers();
  }, [debouncedSearch, roleFilter]);

  const roleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "destructive" as const;
      case "instructor":
        return "info" as const;
      case "corporate_admin":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => <span className="font-medium">{item.full_name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <Badge variant={roleBadgeVariant(item.role)}>
          {item.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.last_login_at
            ? formatRelativeDate(item.last_login_at)
            : "Never"}
        </span>
      ),
    },
  ];

  if (isLoading && users.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("manageUsers")}</h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("all")}
          >
            All
          </Button>
          {ROLE_FILTER_OPTIONS.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            rowKey={(item) => item.id}
            isLoading={isLoading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
