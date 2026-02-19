"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OrganizationForm } from "@/components/admin/OrganizationForm";
import type { OrganizationInput } from "@/lib/utils/validators";

export default function EditOrganizationPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [initialData, setInitialData] = useState<
    (Partial<OrganizationInput> & { id: string; slug: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (data) {
        setInitialData({
          id: data.id,
          slug: data.slug,
          name: data.name,
          nameAr: data.name_ar || "",
          domain: data.domain || "",
          contactEmail: data.contact_email || "",
          contactPhone: data.contact_phone || "",
          address: data.address || "",
          licenseType: data.license_type || "per_seat",
          maxSeats: data.max_seats || undefined,
          licenseStartDate: data.license_start_date
            ? new Date(data.license_start_date).toISOString().slice(0, 10)
            : "",
          licenseEndDate: data.license_end_date
            ? new Date(data.license_end_date).toISOString().slice(0, 10)
            : "",
        });
      }
      setIsLoading(false);
    }

    fetchOrg();
  }, [orgId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Organization not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit Organization</h1>
      <OrganizationForm initialData={initialData} mode="edit" />
    </div>
  );
}
