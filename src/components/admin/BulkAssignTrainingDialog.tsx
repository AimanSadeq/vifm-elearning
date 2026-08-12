"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { fetchAdminProfiles } from "@/lib/api/admin-profiles";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkAssignTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /**
   * POST target. The corporate console passes its own org-scoped route;
   * defaults to the super-admin route. The learner list is scoped
   * server-side by /api/admin/profiles either way.
   */
  endpoint?: string;
}

interface TargetOption {
  id: string;
  title: string;
}

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
}

export function BulkAssignTrainingDialog({
  open,
  onOpenChange,
  onSuccess,
  endpoint = "/api/admin/training-assignments",
}: BulkAssignTrainingDialogProps) {
  const [targetType, setTargetType] = useState<"course" | "path">("course");
  const [courses, setCourses] = useState<TargetOption[]>([]);
  const [paths, setPaths] = useState<TargetOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetId, setTargetId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [notify, setNotify] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!open) return;
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();
      const [coursesRes, pathsRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title")
          .eq("status", "published")
          .order("title"),
        supabase
          .from("learning_paths")
          .select("id, title")
          .eq("is_published", true)
          .order("title"),
      ]);
      setCourses((coursesRes.data as TargetOption[]) ?? []);
      setPaths((pathsRes.data as TargetOption[]) ?? []);
      setTargetId("");
      setSelectedIds(new Set());
      setSearch("");
      setDueDate("");
      setIsMandatory(true);
      setNotify(true);
      setIsLoading(false);
    }
    fetchData();
  }, [open]);

  // Profile columns like email are service-role-only reads; go through the
  // admin profiles API, with server-side search since the list is paged.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchUsers() {
      const { rows, error } = await fetchAdminProfiles({
        search: debouncedSearch || undefined,
        isActive: true,
        pageSize: 200,
        orderBy: "full_name",
      });
      if (cancelled) return;
      if (error) {
        toast.error(`Could not load users: ${error}`);
        setUsers([]);
        return;
      }
      setUsers(
        rows
          .filter((r) => r.role !== "super_admin")
          .map((r) => ({
            id: r.id,
            full_name: r.full_name,
            email: r.email,
            department: r.department,
          })),
      );
    }
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch]);

  const targets = targetType === "course" ? courses : paths;

  const filteredUsers = users;

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.has(u.id));

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredUsers.forEach((u) => next.delete(u.id));
      } else {
        filteredUsers.forEach((u) => next.add(u.id));
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!targetId) {
      toast.error(
        targetType === "course"
          ? "Please select a course"
          : "Please select a learning path",
      );
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Please select at least one learner");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [...selectedIds],
          courseId: targetType === "course" ? targetId : undefined,
          learningPathId: targetType === "path" ? targetId : undefined,
          dueDate: dueDate || undefined,
          isMandatory,
          notify,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Assignment failed");

      const r = json.data as {
        assigned: number;
        skipped: number;
        notified: number;
        errors: string[];
      };
      if (r.assigned > 0) {
        toast.success(
          `Assigned to ${r.assigned} learner${r.assigned === 1 ? "" : "s"}` +
            (r.skipped > 0 ? ` (${r.skipped} already assigned)` : ""),
        );
      } else if (r.skipped > 0) {
        toast.info("All selected learners already have this assignment");
      }
      if (r.errors.length > 0) {
        toast.warning(`${r.errors.length} issue(s): ${r.errors[0]}`);
        console.warn("Assignment issues:", r.errors);
      }
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Assignment failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Assign Training</DialogTitle>
          <DialogDescription>
            Assign a course or learning path to one or more learners, with an
            optional due date. Learners are auto-enrolled and notified.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Training type</Label>
                <Select
                  value={targetType}
                  onValueChange={(v) => {
                    setTargetType(v as "course" | "path");
                    setTargetId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="path">Learning Path</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{targetType === "course" ? "Course" : "Learning Path"}</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        targets.length === 0
                          ? "None available"
                          : `Select a ${targetType === "course" ? "course" : "path"}`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assign-due-date">Due date (optional)</Label>
                <Input
                  id="assign-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                  />
                  Mandatory
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                  />
                  Notify learners (email + in-app)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Learners{" "}
                  <span className="text-muted-foreground">
                    ({selectedIds.size} selected)
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={toggleAllFiltered}
                  disabled={filteredUsers.length === 0}
                >
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                  {search.trim() ? " (filtered)" : ""}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-8"
                />
              </div>
              <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border p-1">
                {filteredUsers.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No matching users
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-primary"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">
                          {u.full_name ?? u.email}
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </span>
                      {u.department && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {u.department}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !targetId || selectedIds.size === 0}
          >
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            Assign{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
