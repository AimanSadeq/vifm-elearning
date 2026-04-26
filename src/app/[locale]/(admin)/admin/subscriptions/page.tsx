"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SubscriptionPlanForm } from "@/components/admin/SubscriptionPlanForm";
import { formatDate } from "@/lib/utils/formatters";
import type { SubscriptionPlanInput } from "@/lib/utils/validators";
import type {
  SubscriptionPlanConfig,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types";

type Tab = "plans" | "subscriptions";

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("plans");

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<SubscriptionPlanConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User subscriptions state
  const [subscriptions, setSubscriptions] = useState<
    (Subscription & { user_email?: string; user_name?: string; plan_name?: string })[]
  >([]);
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, []);

  // ---------- Plans ----------
  async function fetchPlans() {
    setPlansLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    setPlans((data as SubscriptionPlanConfig[]) ?? []);
    setPlansLoading(false);
  }

  async function handleSavePlan(data: SubscriptionPlanInput) {
    setIsSaving(true);
    const supabase = createClient();

    const dbData = {
      name: data.name,
      name_ar: data.nameAr || null,
      description: data.description || null,
      description_ar: data.descriptionAr || null,
      plan_type: data.planType,
      price: data.price,
      currency: data.currency,
      features: data.features ?? [],
      features_ar: data.featuresAr ?? [],
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };

    const { error } = editingPlan
      ? await supabase
          .from("subscription_plans")
          .update(dbData)
          .eq("id", editingPlan.id)
      : await supabase.from("subscription_plans").insert(dbData);

    setIsSaving(false);

    if (error) {
      toast.error(`Could not save plan: ${error.message}`);
      return;
    }

    toast.success(editingPlan ? "Plan updated" : "Plan created");
    setShowForm(false);
    setEditingPlan(null);
    await fetchPlans();
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Delete this subscription plan?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success("Plan deleted");
    await fetchPlans();
  }

  async function handleToggleActive(plan: SubscriptionPlanConfig) {
    const supabase = createClient();
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    if (error) {
      toast.error(`Could not update: ${error.message}`);
      return;
    }
    await fetchPlans();
  }

  // ---------- User Subscriptions ----------
  async function fetchSubscriptions() {
    setSubsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        profiles:user_id (full_name, email),
        subscription_plans:plan_id (name)
      `
      )
      .order("created_at", { ascending: false });

    const mapped = (data ?? []).map((s: Record<string, unknown>) => {
      const profile = s.profiles as Record<string, string> | null;
      const plan = s.subscription_plans as Record<string, string> | null;
      return {
        ...(s as unknown as Subscription),
        user_name: profile?.full_name ?? "—",
        user_email: profile?.email ?? "—",
        plan_name: plan?.name,
      };
    });

    setSubscriptions(mapped);
    setSubsLoading(false);
  }

  function getPlanTypeBadge(type: SubscriptionPlan) {
    switch (type) {
      case "monthly":
        return <Badge variant="secondary">Monthly</Badge>;
      case "quarterly":
        return <Badge variant="info">Quarterly</Badge>;
      case "annual":
        return <Badge variant="warning">Annual</Badge>;
      case "lifetime":
        return <Badge variant="success">Lifetime</Badge>;
    }
  }

  function getStatusBadge(status: SubscriptionStatus) {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "past_due":
        return <Badge variant="warning">Past Due</Badge>;
    }
  }

  // ---------- Plan columns ----------
  const planColumns: Column<SubscriptionPlanConfig>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <div>
          <span className="font-semibold">{item.name}</span>
          {item.name_ar && (
            <span className="ms-2 text-xs text-muted-foreground" dir="rtl">
              {item.name_ar}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => getPlanTypeBadge(item.plan_type),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span className="font-medium">
          ${item.price} {item.currency}
        </span>
      ),
    },
    {
      key: "features",
      header: "Features",
      render: (item) => (
        <span className="text-sm">
          {Array.isArray(item.features) ? item.features.length : 0} features
        </span>
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
      key: "actions",
      header: "",
      className: "w-32",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setEditingPlan(item);
              setShowForm(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleToggleActive(item)}
          >
            {item.is_active ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => handleDeletePlan(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ---------- Subscription columns ----------
  type SubRow = Subscription & {
    user_email?: string;
    user_name?: string;
    plan_name?: string;
  };

  const subColumns: Column<SubRow>[] = [
    {
      key: "user",
      header: "User",
      render: (item) => (
        <div>
          <span className="font-medium">{item.user_name}</span>
          <span className="ms-2 text-xs text-muted-foreground">
            {item.user_email}
          </span>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (item) => (
        <span>{item.plan_name ?? getPlanTypeBadge(item.plan)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span className="text-sm">
          ${item.price} {item.currency}
        </span>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.current_period_start
            ? formatDate(item.current_period_start)
            : "—"}{" "}
          →{" "}
          {item.current_period_end
            ? formatDate(item.current_period_end)
            : "—"}
        </span>
      ),
    },
    {
      key: "stripe",
      header: "Stripe ID",
      render: (item) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px] block">
          {item.stripe_subscription_id ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Subscriptions</h1>
        {tab === "plans" && (
          <Button
            onClick={() => {
              setEditingPlan(null);
              setShowForm(!showForm);
            }}
          >
            <Plus className="h-4 w-4 me-2" />
            Create Plan
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("plans")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "plans"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Plans
        </button>
        <button
          onClick={() => setTab("subscriptions")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "subscriptions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          User Subscriptions
        </button>
      </div>

      {/* Plans Tab */}
      {tab === "plans" && (
        <>
          {showForm && (
            <SubscriptionPlanForm
              initialData={
                editingPlan
                  ? {
                      id: editingPlan.id,
                      name: editingPlan.name,
                      nameAr: editingPlan.name_ar ?? undefined,
                      description: editingPlan.description ?? undefined,
                      descriptionAr:
                        editingPlan.description_ar ?? undefined,
                      planType: editingPlan.plan_type,
                      price: editingPlan.price,
                      currency: editingPlan.currency,
                      features: Array.isArray(editingPlan.features)
                        ? editingPlan.features
                        : [],
                      featuresAr: Array.isArray(editingPlan.features_ar)
                        ? editingPlan.features_ar
                        : [],
                      isActive: editingPlan.is_active,
                      sortOrder: editingPlan.sort_order,
                    }
                  : undefined
              }
              onSubmit={handleSavePlan}
              onCancel={() => {
                setShowForm(false);
                setEditingPlan(null);
              }}
              isLoading={isSaving}
            />
          )}

          <Card>
            <CardHeader />
            <CardContent>
              <DataTable
                columns={planColumns}
                data={plans}
                isLoading={plansLoading}
                rowKey={(item) => item.id}
                emptyMessage="No subscription plans yet. Create one to get started."
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* User Subscriptions Tab */}
      {tab === "subscriptions" && (
        <Card>
          <CardHeader />
          <CardContent>
            <DataTable
              columns={subColumns}
              data={subscriptions}
              isLoading={subsLoading}
              rowKey={(item) => item.id}
              emptyMessage="No user subscriptions yet."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
