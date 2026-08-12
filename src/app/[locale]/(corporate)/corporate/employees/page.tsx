"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, UserX, UserCheck, ArrowLeftRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchAdminProfiles } from "@/lib/api/admin-profiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { InviteEmployeeDialog } from "@/components/corporate/InviteEmployeeDialog";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatRelativeDate } from "@/lib/utils/formatters";

interface Employee {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean | null;
  last_login_at: string | null;
}

interface SeatUsage {
  used: number;
  maxSeats: number | null;
}

export default function CorporateEmployeesPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [seats, setSeats] = useState<SeatUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [showInvite, setShowInvite] = useState(false);
  const [transferFrom, setTransferFrom] = useState<Employee | null>(null);
  const [editingDept, setEditingDept] = useState<Employee | null>(null);
  const [newDept, setNewDept] = useState("");
  const [isSavingDept, setIsSavingDept] = useState(false);

  const fetchSeats = useCallback(async () => {
    try {
      const res = await fetch("/api/corporate/employees");
      const json = await res.json();
      if (res.ok) setSeats(json.data as SeatUsage);
    } catch {
      // seat card is informational; the table is the primary content
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!user?.organization_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // The route re-derives the organization from the caller's own row, so a
    // corporate admin cannot read another company's staff by editing the
    // request; the organization_id below is a hint, not the authority.
    const { rows, error } = await fetchAdminProfiles({
      organizationId: user.organization_id,
      orderBy: "full_name",
      pageSize: 200,
      search: debouncedSearch || undefined,
    });
    if (error) {
      toast.error(error);
      setEmployees([]);
    } else {
      setEmployees(rows as Employee[]);
    }
    setIsLoading(false);
  }, [user, debouncedSearch]);

  useEffect(() => {
    if (!authLoading) {
      fetchEmployees();
      fetchSeats();
    }
  }, [authLoading, fetchEmployees, fetchSeats]);

  function refresh() {
    fetchEmployees();
    fetchSeats();
  }

  async function patchEmployee(
    id: string,
    body: Record<string, unknown>,
    successMsg: string,
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/corporate/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      toast.success(successMsg);
      refresh();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
      return false;
    }
  }

  async function handleSaveDept() {
    if (!editingDept) return;
    setIsSavingDept(true);
    await patchEmployee(
      editingDept.id,
      { department: newDept.trim() || null },
      "Department updated",
    );
    setIsSavingDept(false);
    setEditingDept(null);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const seatsLabel =
    seats === null
      ? "..."
      : seats.maxSeats === null
        ? `${seats.used} / ${t("unlimited")}`
        : `${seats.used} / ${seats.maxSeats}`;
  const seatsFull =
    seats !== null && seats.maxSeats !== null && seats.used >= seats.maxSeats;

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: t("employeeName"),
      render: (item) => (
        <div className="min-w-40">
          <p className="font-medium">{item.full_name ?? item.email}</p>
          <p className="text-xs text-muted-foreground">{item.email}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (item) => (
        <span className="text-sm">{item.department ?? "—"}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <Badge variant="outline">{(item.role ?? "").replace("_", " ")}</Badge>
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
      header: t("lastActive"),
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.last_login_at ? formatRelativeDate(item.last_login_at) : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (item) =>
        item.role === "learner" ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Edit department"
              onClick={() => {
                setEditingDept(item);
                setNewDept(item.department ?? "");
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {item.is_active ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Transfer license to a replacement"
                  onClick={() => setTransferFrom(item)}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  title="Deactivate (frees the seat)"
                  onClick={() => {
                    if (
                      confirm(
                        `Deactivate ${item.full_name ?? item.email}? They can no longer sign in and their seat is freed.`,
                      )
                    ) {
                      patchEmployee(item.id, { isActive: false }, "Employee deactivated");
                    }
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Reactivate (uses a seat)"
                onClick={() =>
                  patchEmployee(item.id, { isActive: true }, "Employee reactivated")
                }
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold">{t("employees")}</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">{t("seatsUsed")}: </span>
            <span className={`font-semibold ${seatsFull ? "text-destructive" : ""}`}>
              {seatsLabel}
            </span>
          </div>
          <Button onClick={() => setShowInvite(true)} disabled={seatsFull}>
            <UserPlus className="me-2 h-4 w-4" />
            {t("inviteEmployee")}
          </Button>
        </div>
      </div>

      {seatsFull && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950">
          All seats are in use. Deactivate an employee to free a seat, use
          Transfer to replace a departed employee, or contact VIFM to add seats.
        </p>
      )}

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
            emptyMessage={t("noEmployees")}
          />
        </CardContent>
      </Card>

      <InviteEmployeeDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        onSuccess={refresh}
      />

      <InviteEmployeeDialog
        open={transferFrom !== null}
        onOpenChange={(open) => !open && setTransferFrom(null)}
        onSuccess={refresh}
        transferFrom={
          transferFrom
            ? {
                id: transferFrom.id,
                name: transferFrom.full_name ?? transferFrom.email ?? "",
                email: transferFrom.email ?? "",
              }
            : null
        }
      />

      <Dialog
        open={editingDept !== null}
        onOpenChange={(open) => !open && setEditingDept(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-department">Department</Label>
            <Input
              id="edit-department"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g. Finance"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to clear the department.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDept(null)}
              disabled={isSavingDept}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDept} disabled={isSavingDept}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
