"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  color?: string;
  bg?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = "neutral",
  color = "text-brand-600",
  bg = "bg-brand-50",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            bg
          )}
        >
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {change && (
            <p
              className={cn(
                "mt-0.5 text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-error",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
