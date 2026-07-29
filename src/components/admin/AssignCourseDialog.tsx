"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

interface CourseOption {
  id: string;
  title: string;
}

export function AssignCourseDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: AssignCourseDialogProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchCourses() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("status", "published")
        .order("title");

      setCourses((data as CourseOption[]) ?? []);
      setSelectedCourseId("");
      setIsLoading(false);
    }

    fetchCourses();
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Direct INSERT on enrollments is revoked for `authenticated`; an admin
      // grant goes through the service-role route, which also handles the
      // already-enrolled case.
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId: selectedCourseId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to enroll user");
        return;
      }

      toast.success("User enrolled in course");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to enroll user";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Course</DialogTitle>
          <DialogDescription>
            Enroll <strong>{userName}</strong> in a published course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Course</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published courses available</p>
            ) : (
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedCourseId}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
