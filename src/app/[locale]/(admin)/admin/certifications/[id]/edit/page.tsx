"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CertificationEditor } from "@/components/admin/CertificationEditor";
import type {
  Designation,
  DesignationTier,
  CPECategory,
  DesignationDocument,
} from "@/types";

export default function EditCertificationPage() {
  const t = useTranslations("admin");
  const params = useParams();
  const id = params.id as string;

  const [designation, setDesignation] = useState<Designation | null>(null);
  const [tiers, setTiers] = useState<DesignationTier[]>([]);
  const [cpeCategories, setCpeCategories] = useState<CPECategory[]>([]);
  const [documents, setDocuments] = useState<DesignationDocument[]>([]);
  const [holderCount, setHolderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [desigRes, tiersRes, cpeRes, docsRes, holdersRes] =
        await Promise.all([
          supabase.from("designations").select("*").eq("id", id).single(),
          supabase
            .from("designation_tiers")
            .select("*")
            .eq("designation_id", id)
            .order("sort_order"),
          supabase
            .from("cpe_categories")
            .select("*")
            .eq("designation_id", id)
            .order("sort_order"),
          supabase
            .from("designation_documents")
            .select("*")
            .eq("designation_id", id)
            .order("sort_order"),
          supabase
            .from("designation_holders")
            .select("id", { count: "exact" })
            .eq("designation_id", id)
            .eq("status", "active"),
        ]);

      if (desigRes.data) setDesignation(desigRes.data as Designation);
      if (tiersRes.data) setTiers(tiersRes.data as DesignationTier[]);
      if (cpeRes.data) setCpeCategories(cpeRes.data as CPECategory[]);
      if (docsRes.data) setDocuments(docsRes.data as DesignationDocument[]);
      setHolderCount(holdersRes.count ?? 0);
      setIsLoading(false);
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!designation) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Certification not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("editCertification")}: {designation.abbreviation}
      </h1>
      <CertificationEditor
        designation={designation}
        initialTiers={tiers}
        initialCpeCategories={cpeCategories}
        initialDocuments={documents}
        holderCount={holderCount}
      />
    </div>
  );
}
