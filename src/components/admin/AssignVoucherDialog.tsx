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

interface AssignVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

interface VoucherOption {
  id: string;
  code: string;
  voucher_type: string;
  discount_value: number | null;
  applicable_courses: string[];
}

interface CourseOption {
  id: string;
  title: string;
}

export function AssignVoucherDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: AssignVoucherDialogProps) {
  const [vouchers, setVouchers] = useState<VoucherOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVoucher = vouchers.find((v) => v.id === selectedVoucherId);
  const applicableCourses = selectedVoucher?.applicable_courses ?? [];

  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      const [voucherRes, courseRes] = await Promise.all([
        supabase
          .from("vouchers")
          .select("id, code, voucher_type, discount_value, applicable_courses")
          .eq("is_active", true)
          .order("code"),
        supabase
          .from("courses")
          .select("id, title")
          .eq("status", "published")
          .order("title"),
      ]);

      setVouchers((voucherRes.data as VoucherOption[]) ?? []);
      setCourses((courseRes.data as CourseOption[]) ?? []);
      setSelectedVoucherId("");
      setSelectedCourseId("");
      setIsLoading(false);
    }

    fetchData();
  }, [open]);

  // Filter courses to applicable ones if the voucher specifies them
  const courseOptions =
    applicableCourses.length > 0
      ? courses.filter((c) => applicableCourses.includes(c.id))
      : courses;

  const handleSubmit = async () => {
    if (!selectedVoucherId) {
      toast.error("Please select a voucher");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("voucher_redemptions").insert({
        voucher_id: selectedVoucherId,
        user_id: userId,
        course_id: selectedCourseId || null,
        redeemed_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Increment current_uses
      if (selectedVoucher) {
        await supabase
          .from("vouchers")
          .update({ current_uses: (selectedVoucher as VoucherOption & { current_uses?: number }).current_uses ? (selectedVoucher as VoucherOption & { current_uses?: number }).current_uses! + 1 : 1 })
          .eq("id", selectedVoucherId);
      }

      toast.success("Voucher assigned to user");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to assign voucher";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVoucherLabel = (v: VoucherOption) => {
    if (v.voucher_type === "full_access") return `${v.code} (Full Access)`;
    if (v.voucher_type === "percentage") return `${v.code} (${v.discount_value}% off)`;
    return `${v.code} ($${v.discount_value} off)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Voucher</DialogTitle>
          <DialogDescription>
            Redeem a voucher for <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Voucher</Label>
                {vouchers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active vouchers available</p>
                ) : (
                  <Select value={selectedVoucherId} onValueChange={(v) => { setSelectedVoucherId(v); setSelectedCourseId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voucher" />
                    </SelectTrigger>
                    <SelectContent>
                      {vouchers.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {formatVoucherLabel(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedVoucherId && courseOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Course (optional)</Label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedVoucherId}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            Assign Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
