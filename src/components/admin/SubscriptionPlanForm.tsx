"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  subscriptionPlanSchema,
  type SubscriptionPlanInput,
} from "@/lib/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SubscriptionPlanFormProps {
  initialData?: Partial<SubscriptionPlanInput> & { id?: string };
  onSubmit: (data: SubscriptionPlanInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SubscriptionPlanForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: SubscriptionPlanFormProps) {
  const [features, setFeatures] = useState<string[]>(
    initialData?.features ?? []
  );
  const [featuresAr, setFeaturesAr] = useState<string[]>(
    initialData?.featuresAr ?? []
  );
  const [newFeature, setNewFeature] = useState("");
  const [newFeatureAr, setNewFeatureAr] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubscriptionPlanInput>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      nameAr: initialData?.nameAr ?? "",
      description: initialData?.description ?? "",
      descriptionAr: initialData?.descriptionAr ?? "",
      planType: initialData?.planType ?? "monthly",
      price: initialData?.price ?? 0,
      currency: initialData?.currency ?? "USD",
      isActive: initialData?.isActive ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
      features: initialData?.features ?? [],
      featuresAr: initialData?.featuresAr ?? [],
    },
  });

  function addFeature() {
    if (newFeature.trim()) {
      setFeatures((prev) => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  }

  function removeFeature(index: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  function addFeatureAr() {
    if (newFeatureAr.trim()) {
      setFeaturesAr((prev) => [...prev, newFeatureAr.trim()]);
      setNewFeatureAr("");
    }
  }

  function removeFeatureAr(index: number) {
    setFeaturesAr((prev) => prev.filter((_, i) => i !== index));
  }

  function onFormSubmit(data: SubscriptionPlanInput) {
    // Inject manually-managed feature lists
    onSubmit({ ...data, features, featuresAr });
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">
          {initialData?.id
            ? "Edit Subscription Plan"
            : "Create Subscription Plan"}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Row 1: Name (EN/AR) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name (English)</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Monthly"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Plan Name (Arabic)</Label>
              <Input
                id="nameAr"
                {...register("nameAr")}
                placeholder="الاسم بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 2: Description (EN/AR) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description (English)</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="e.g. Perfect for getting started"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <Input
                id="descriptionAr"
                {...register("descriptionAr")}
                placeholder="الوصف بالعربية"
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 3: Plan Type, Price, Currency */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type</Label>
              <select
                id="planType"
                {...register("planType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="e.g. 49.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} />
            </div>
          </div>

          {/* Row 4: Sort Order + toggles */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="text-sm">
                Active
              </Label>
            </div>
          </div>

          {/* Features (EN) */}
          <div className="space-y-2">
            <Label>Features (English)</Label>
            <div className="space-y-1">
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm"
                >
                  <span className="flex-1">{f}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => removeFeature(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Features (AR) */}
          <div className="space-y-2">
            <Label>Features (Arabic)</Label>
            <div className="space-y-1">
              {featuresAr.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm"
                  dir="rtl"
                >
                  <span className="flex-1">{f}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => removeFeatureAr(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFeatureAr}
                onChange={(e) => setNewFeatureAr(e.target.value)}
                placeholder="أضف ميزة..."
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeatureAr();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeatureAr}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
                  ? "Update Plan"
                  : "Create Plan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
