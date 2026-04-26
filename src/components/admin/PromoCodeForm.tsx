"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promoCodeSchema, type PromoCodeInput } from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PromoCodeFormProps {
  initialData?: Partial<PromoCodeInput>;
  onSubmit: (data: PromoCodeInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PromoCodeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: PromoCodeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromoCodeInput>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      discountType: initialData?.discountType ?? "percentage",
      discountValue: initialData?.discountValue ?? 10,
      currency: initialData?.currency ?? "USD",
      maxUses: initialData?.maxUses ?? undefined,
      minPurchaseAmount: initialData?.minPurchaseAmount ?? 0,
      startsAt: initialData?.startsAt ?? undefined,
      expiresAt: initialData?.expiresAt ?? undefined,
    },
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          {initialData ? "Edit Promo Code" : "Create Promo Code"}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {Object.keys(errors).length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-semibold">Please fix the issues below:</p>
              <ul className="mt-1 list-disc ps-5">
                {Object.entries(errors).map(([field, err]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span>{" "}
                    {err && typeof err === "object" && "message" in err
                      ? String((err as { message?: string }).message ?? "Invalid value")
                      : "Invalid value"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g. SAVE20"
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
              <Input id="description" {...register("description")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type</Label>
              <select
                id="discountType"
                {...register("discountType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input
                id="discountValue"
                type="number"
                {...register("discountValue", { valueAsNumber: true })}
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Unlimited"
                {...register("maxUses", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPurchaseAmount">Min Purchase</Label>
              <Input
                id="minPurchaseAmount"
                type="number"
                {...register("minPurchaseAmount", { valueAsNumber: true })}
              />
            </div>
          </div>

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : initialData
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
