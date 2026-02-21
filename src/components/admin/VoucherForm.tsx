"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { voucherSchema, type VoucherInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface VoucherFormProps {
  initialData?: Partial<VoucherInput> & { id?: string };
  onSubmit: (data: VoucherInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CourseOption {
  id: string;
  title: string;
}

export function VoucherForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: VoucherFormProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VoucherInput>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      voucherType: initialData?.voucherType ?? "full_access",
      discountValue: initialData?.discountValue ?? undefined,
      currency: initialData?.currency ?? "USD",
      maxUses: initialData?.maxUses ?? undefined,
      isSingleUse: initialData?.isSingleUse ?? true,
      applicableCourses: initialData?.applicableCourses ?? [],
      startsAt: initialData?.startsAt ?? undefined,
      expiresAt: initialData?.expiresAt ?? undefined,
    },
  });

  const voucherType = watch("voucherType");
  const isSingleUse = watch("isSingleUse");

  // Fetch published courses for the multi-select
  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("status", "published")
        .order("title");
      setCourses(data ?? []);
    }
    fetchCourses();
  }, []);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          {initialData?.id ? "Edit Voucher" : "Create Voucher"}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Code & Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Voucher Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g. FREEACCESS2024"
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="e.g. Corporate training voucher"
              />
            </div>
          </div>

          {/* Row 2: Voucher Type, Discount Value, Currency */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="voucherType">Voucher Type</Label>
              <select
                id="voucherType"
                {...register("voucherType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full_access">Full Free Access</option>
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed_amount">Fixed Amount Discount</option>
              </select>
            </div>

            {voucherType !== "full_access" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {voucherType === "percentage"
                      ? "Discount (%)"
                      : "Discount Amount"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    {...register("discountValue", { valueAsNumber: true })}
                    placeholder={
                      voucherType === "percentage" ? "e.g. 25" : "e.g. 50.00"
                    }
                  />
                  {errors.discountValue && (
                    <p className="text-sm text-destructive">
                      {errors.discountValue.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" {...register("currency")} />
                </div>
              </>
            )}
          </div>

          {/* Row 3: Single Use toggle, Max Uses */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="isSingleUse">Usage Type</Label>
              <select
                id="isSingleUse"
                {...register("isSingleUse", {
                  setValueAs: (v) => v === "true" || v === true,
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="true">Single Use (one person)</option>
                <option value="false">Multi Use (many people)</option>
              </select>
            </div>

            {!isSingleUse && (
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Unlimited"
                  {...register("maxUses", { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Row 4: Applicable Courses */}
          <div className="space-y-2">
            <Label htmlFor="applicableCourses">
              Applicable Courses{" "}
              <span className="text-xs text-muted-foreground">
                (leave empty for all courses)
              </span>
            </Label>
            <select
              id="applicableCourses"
              multiple
              {...register("applicableCourses")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple courses
            </p>
          </div>

          {/* Row 5: Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Starts At</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                {...register("startsAt")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register("expiresAt")}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : initialData?.id
                  ? "Update Voucher"
                  : "Create Voucher"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
