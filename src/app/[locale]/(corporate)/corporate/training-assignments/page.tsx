"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { BulkAssignTrainingDialog } from "@/components/admin/BulkAssignTrainingDialog";
import { exportToCSV } from "@/lib/utils/csv-export";

/**
 * Corporate self-service view of training assignments, scoped server-side to
 * the admin's own organization. Assigning uses the shared dialog against the
 * corporate route; row management (due-date changes, cancellation) stays with
 * VIFM super-admins.
 */

interface AssignmentRow {
  id: string;
  user_id: string;
  course_id: string | null;
  learning_path_id: string | null;
  due_date: string | null;
  is_mandatory: boolean;
  status: "assigned" | "completed" | "cancelled";
  completed_at: string | null;
  reminders_sent: number;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
    department: string | null;
  } | null;
  course: { title: string | null; slug: string | null } | null;
  learning_path: { title: string | null; slug: string | null } | null;
}

type StatusFilter = "all" | "assigned" | "overdue" | "completed" | "cancelled";

function isOverdue(a: AssignmentRow): boolean {
  if (a.status !== "assigned" || !a.due_date) return false;
  return a.due_date < new Date().toISOString().slice(0, 10);
}

function trainingTitle(a: AssignmentRow): string {
  return a.course?.title ?? a.learning_path?.title ?? "—";
}

export default function CorporateTrainingAssignmentsPage() {
  const t = useTranslations("corporate");
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/corporate/training-assignments");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.data as AssignmentRow[]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not load assignments";
      toast.error(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter === "overdue") out = out.filter(isOverdue);
    else if (statusFilter !== "all")
      out = out.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          (r.user?.full_name ?? "").toLowerCase().includes(q) ||
          (r.user?.email ?? "").toLowerCase().includes(q) ||
          (r.user?.department ?? "").toLowerCase().includes(q) ||
          trainingTitle(r).toLowerCase().includes(q),
      );
    }
    return out;
  }, [rows, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      open: rows.filter((r) => r.status === "assigned").length,
      overdue: rows.filter(isOverdue).length,
      completed: rows.filter((r) => r.status === "completed").length,
    };
  }, [rows]);

  function handleExport() {
    exportToCSV(
      filtered.map((r) => ({
        employee: r.user?.full_name ?? "",
        email: r.user?.email ?? "",
        department: r.user?.department ?? "",
        training: trainingTitle(r),
        type: r.course_id ? "Course" : "Learning Path",
        mandatory: r.is_mandatory ? "Yes" : "No",
        due_date: r.due_date ?? "",
        status: isOverdue(r) ? "overdue" : r.status,
        completed_at: r.completed_at?.slice(0, 10) ?? "",
        assigned_at: r.created_at.slice(0, 10),
      })),
      `training-assignments-${new Date().toISOString().slice(0, 10)}`,
    );
  }

  function statusBadge(a: AssignmentRow) {
    if (a.status === "completed") return <Badge variant="success">Completed</Badge>;
    if (a.status === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
    if (isOverdue(a)) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="info">Assigned</Badge>;
  }

  const columns: Column<AssignmentRow>[] = [
    {
      key: "employee",
      header: t("employeeName"),
      render: (a) => (
        <div className="min-w-40">
          <div className="font-medium">{a.user?.full_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{a.user?.email}</div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (a) => <span className="text-sm">{a.user?.department ?? "—"}</span>,
    },
    {
      key: "training",
      header: "Training",
      render: (a) => (
        <div className="min-w-44">
          <div className="font-medium">{trainingTitle(a)}</div>
          <div className="text-xs text-muted-foreground">
            {a.course_id ? "Course" : "Learning Path"}
            {a.is_mandatory ? " · Mandatory" : " · Optional"}
          </div>
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      render: (a) => (
        <span className={isOverdue(a) ? "font-medium text-destructive" : "text-sm"}>
          {a.due_date ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => statusBadge(a),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {t("trainingAssignments")}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download className="me-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAssign(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t("assignCourse")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Total", stats.total],
            ["Open", stats.open],
            ["Overdue", stats.overdue],
            ["Completed", stats.completed],
          ] as const
        ).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div
                className={`text-2xl font-bold ${
                  label === "Overdue" && value > 0 ? "text-destructive" : ""
                }`}
              >
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search employee, department, or training..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            rowKey={(a) => a.id}
            emptyMessage="No training assignments yet. Use Assign Course to create the first one."
          />
        </CardContent>
      </Card>

      <BulkAssignTrainingDialog
        open={showAssign}
        onOpenChange={setShowAssign}
        onSuccess={fetchAssignments}
        endpoint="/api/corporate/training-assignments"
      />
    </div>
  );
}
