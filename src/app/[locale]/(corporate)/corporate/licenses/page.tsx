"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Key, Users, Calendar, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils/formatters";

interface LicenseInfo {
  organizationName: string;
  licenseType: string;
  maxSeats: number | null;
  seatsUsed: number;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  isActive: boolean;
}

export default function CorporateLicensesPage() {
  const t = useTranslations("corporate");
  const { user, isLoading: authLoading } = useAuth();

  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLicense() {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const orgId = user.organization_id;

      const [orgRes, employeesRes] = await Promise.all([
        supabase
          .from("organizations")
          .select(
            "name, license_type, max_seats, license_start_date, license_end_date, is_active"
          )
          .eq("id", orgId)
          .single(),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
      ]);

      if (orgRes.data) {
        const isExpired = orgRes.data.license_end_date
          ? new Date(orgRes.data.license_end_date) < new Date()
          : false;

        setLicense({
          organizationName: orgRes.data.name,
          licenseType: orgRes.data.license_type || "per_seat",
          maxSeats: orgRes.data.max_seats,
          seatsUsed: employeesRes.count ?? 0,
          licenseStartDate: orgRes.data.license_start_date,
          licenseEndDate: orgRes.data.license_end_date,
          isActive: orgRes.data.is_active && !isExpired,
        });
      }

      setIsLoading(false);
    }

    if (!authLoading) fetchLicense();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        No license information available.
      </div>
    );
  }

  const seatPercentage = license.maxSeats
    ? Math.round((license.seatsUsed / license.maxSeats) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("licenses")}</h1>

      {/* License Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Badge
              variant={license.isActive ? "success" : "destructive"}
              className="text-sm"
            >
              {license.isActive ? t("licenseActive") : t("licenseExpired")}
            </Badge>
            <span className="text-muted-foreground">
              {license.organizationName}
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                {t("licenseType")}
              </div>
              <p className="mt-1 font-semibold capitalize">
                {license.licenseType.replace("_", " ")}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {t("seatsUsed")}
              </div>
              <p className="mt-1 font-semibold">
                {license.seatsUsed} / {license.maxSeats || "∞"}
              </p>
            </div>

            {license.licenseStartDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("licenseStart")}
                </div>
                <p className="mt-1 font-semibold">
                  {formatDate(license.licenseStartDate)}
                </p>
              </div>
            )}

            {license.licenseEndDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("licenseEnd")}
                </div>
                <p className="mt-1 font-semibold">
                  {formatDate(license.licenseEndDate)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seat Usage */}
      {license.maxSeats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seat Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                {license.seatsUsed} of {license.maxSeats} seats used
              </span>
              <span className="font-medium">{seatPercentage}%</span>
            </div>
            <Progress value={seatPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {license.maxSeats - license.seatsUsed} seats remaining
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
