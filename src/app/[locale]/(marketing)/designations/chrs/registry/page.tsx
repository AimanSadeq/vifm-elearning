"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Search, Award, Star, Users, Shield, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RegistryHolder {
  id: string;
  member_number: string;
  certified_at: string;
  registry_company: string | null;
  registry_company_ar: string | null;
  registry_title: string | null;
  registry_title_ar: string | null;
  status: string;
  tier: {
    name: string;
    name_ar: string | null;
    slug: string;
  } | null;
  profile: {
    full_name: string;
  } | null;
}

export default function CHRSRegistryPage() {
  const locale = useLocale();
  const [holders, setHolders] = useState<RegistryHolder[]>([]);
  const [filteredHolders, setFilteredHolders] = useState<RegistryHolder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistry() {
      const supabase = createClient();

      // Get CHRS designation ID
      const { data: designation } = await supabase
        .from("designations")
        .select("id")
        .eq("slug", "chrs")
        .single();

      if (!designation) {
        setIsLoading(false);
        return;
      }

      const { data, count } = await supabase
        .from("designation_holders")
        .select(
          `id, member_number, certified_at, registry_company, registry_company_ar, registry_title, registry_title_ar, status,
          tier:designation_tiers!designation_holders_tier_id_fkey(name, name_ar, slug),
          profile:profiles!designation_holders_user_id_fkey(full_name)`,
          { count: "exact" }
        )
        .eq("designation_id", designation.id)
        .in("status", ["active", "grace_period"])
        .eq("show_in_registry", true)
        .order("certified_at", { ascending: true });

      const holderList = (data ?? []) as unknown as RegistryHolder[];
      setHolders(holderList);
      setFilteredHolders(holderList);
      setTotalCount(count ?? 0);
      setIsLoading(false);
    }

    fetchRegistry();
  }, []);

  const applyFilters = useCallback(() => {
    let results = [...holders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter((h) => {
        const name = h.profile?.full_name?.toLowerCase() ?? "";
        const company = (h.registry_company ?? "").toLowerCase();
        const companyAr = (h.registry_company_ar ?? "").toLowerCase();
        const memberNum = (h.member_number ?? "").toLowerCase();
        return name.includes(q) || company.includes(q) || companyAr.includes(q) || memberNum.includes(q);
      });
    }
    if (tierFilter !== "all") {
      results = results.filter((h) => h.tier?.slug === tierFilter);
    }
    setFilteredHolders(results);
  }, [holders, searchQuery, tierFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <Shield className="h-4 w-4" />
          {locale === "ar" ? "التحقق من الشهادة" : "Credential Verification"}
        </div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {locale === "ar" ? "سجل CHRS العام" : "CHRS Public Registry"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          {locale === "ar"
            ? "تحقق من حالة شهادة أي محترف CHRS. ابحث بالاسم أو الشركة أو رقم العضوية."
            : "Verify the certification status of any CHRS professional. Search by name, company, or member number."}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold">{totalCount}</span>
          <span className="text-muted-foreground">{locale === "ar" ? "محترف نشط" : "Active Professionals"}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={locale === "ar" ? "ابحث بالاسم أو الشركة أو رقم العضوية..." : "Search by name, company, or member number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">{locale === "ar" ? "جميع المستويات" : "All Tiers"}</option>
              <option value="founding-member">{locale === "ar" ? "عضو مؤسس" : "Founding Member"}</option>
              <option value="standard">{locale === "ar" ? "عادي" : "Standard"}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {locale === "ar" ? `عرض ${filteredHolders.length} من ${totalCount} محترف` : `Showing ${filteredHolders.length} of ${totalCount} professionals`}
      </p>

      {filteredHolders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">{locale === "ar" ? "لم يتم العثور على نتائج" : "No results found"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHolders.map((holder) => {
            const company = locale === "ar" && holder.registry_company_ar ? holder.registry_company_ar : holder.registry_company;
            const title = locale === "ar" && holder.registry_title_ar ? holder.registry_title_ar : holder.registry_title;
            const tierName = locale === "ar" && holder.tier?.name_ar ? holder.tier.name_ar : holder.tier?.name;
            const isFoundingMember = holder.tier?.slug === "founding-member";

            return (
              <Card key={holder.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Award className={`h-6 w-6 ${isFoundingMember ? "text-amber-600" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{holder.profile?.full_name}</p>
                      {isFoundingMember && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          <Star className="h-3 w-3" />{tierName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      {company && <span>{company}</span>}
                      {company && title && <span className="hidden sm:inline">·</span>}
                      {title && <span className="hidden sm:inline">{title}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{holder.member_number}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {locale === "ar" ? "منذ" : "Since"}{" "}
                      {new Date(holder.certified_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Link href={`/${locale}/designations/chrs/verify/${holder.member_number}`}>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-1.5 hidden sm:inline">{locale === "ar" ? "تحقق" : "Verify"}</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
