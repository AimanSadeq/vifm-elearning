"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Search,
  Plus,
  Upload,
  Pencil,
  BookOpen,
  Ticket,
  Mail,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { escapeIlike } from "@/lib/utils/escape-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatRelativeDate } from "@/lib/utils/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { AssignCourseDialog } from "@/components/admin/AssignCourseDialog";
import { AssignVoucherDialog } from "@/components/admin/AssignVoucherDialog";
import { SendEmailDialog } from "@/components/admin/SendEmailDialog";
import { BulkImportDialog } from "@/components/admin/BulkImportDialog";
import type { Profile, UserRole } from "@/types";

type UserRow = Pick<
  Profile,
  "id" | "full_name" | "full_name_ar" | "email" | "phone" | "role" | "organization_id" | "language" | "is_active" | "last_login_at" | "created_at"
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

  // Dialog state
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAssignCourse, setShowAssignCourse] = useState(false);
  const [showAssignVoucher, setShowAssignVoucher] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, full_name_ar, email, phone, role, organization_id, language, is_active, last_login_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    if (debouncedSearch) {
      const s = escapeIlike(debouncedSearch);
      query = query.or(
        `full_name.ilike.%${s}%,email.ilike.%${s}%`
      );
    }

    const { data } = await query;
    setUsers((data as UserRow[]) ?? []);
    setIsLoading(false);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleToggleActive = async (user: UserRow) => {
    const supabase = createClient();
    const newStatus = !user.is_active;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: newStatus })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update user status");
      return;
    }

    toast.success(`User ${newStatus ? "activated" : "deactivated"}`);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Delete failed");
      }

      toast.success("User deleted");
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
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
      className: "hidden sm:table-cell",
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
      className: "hidden sm:table-cell",
      render: (item) => (
        <Badge variant={item.is_active ? "success" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      className: "hidden md:table-cell",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.last_login_at
            ? formatRelativeDate(item.last_login_at)
            : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit"
            onClick={() => {
              setSelectedUser(item);
              setShowUserForm(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Assign Course"
            onClick={() => {
              setSelectedUser(item);
              setShowAssignCourse(true);
            }}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Assign Voucher"
            onClick={() => {
              setSelectedUser(item);
              setShowAssignVoucher(true);
            }}
          >
            <Ticket className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Send Email"
            onClick={() => {
              setSelectedUser(item);
              setShowSendEmail(true);
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={item.is_active ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(item)}
          >
            {item.is_active ? (
              <ToggleRight className="h-4 w-4 text-green-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete"
            onClick={() => {
              setSelectedUser(item);
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("manageUsers")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="me-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => { setSelectedUser(null); setShowUserForm(true); }}>
            <Plus className="me-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

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

      {/* User Form Dialog (Create / Edit) */}
      <UserFormDialog
        open={showUserForm}
        onOpenChange={setShowUserForm}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Assign Course Dialog */}
      {selectedUser && (
        <AssignCourseDialog
          open={showAssignCourse}
          onOpenChange={setShowAssignCourse}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          onSuccess={fetchUsers}
        />
      )}

      {/* Assign Voucher Dialog */}
      {selectedUser && (
        <AssignVoucherDialog
          open={showAssignVoucher}
          onOpenChange={setShowAssignVoucher}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          onSuccess={fetchUsers}
        />
      )}

      {/* Send Email Dialog */}
      {selectedUser && (
        <SendEmailDialog
          open={showSendEmail}
          onOpenChange={setShowSendEmail}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          userEmail={selectedUser.email}
        />
      )}

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email})?
              This action cannot be undone and will remove the user from
              authentication and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
