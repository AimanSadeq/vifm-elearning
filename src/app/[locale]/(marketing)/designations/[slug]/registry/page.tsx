"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  Award,
  Star,
  Users,
  Shield,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

/** Server-side page size for the registry. Filtering/search runs on what's
 *  been loaded — users can hit "Load more" to fetch the next batch. */
const PAGE_SIZE = 60;

/** Format counts with Latin (Arabic-numeral) digits even under `ar` locale —
 *  member-number/registry contexts conventionally use Western digits. */
function fmtCount(n: number, locale: string): string {
  return n.toLocaleString(locale, { numberingSystem: "latn" });
}

interface DesignationInfo {
  id: string;
  name: string;
  name_ar: string | null;
  abbreviation: string;
  slug: string;
  metadata: Record<string, unknown> | null;
}

interface RegistryHolderRaw {
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
    badge_url: string | null;
  }[];
  profile: {
    full_name: string;
  }[];
}

interface RegistryHolder extends Omit<RegistryHolderRaw, "tier" | "profile"> {
  tier: RegistryHolderRaw["tier"][number] | null;
  profile: RegistryHolderRaw["profile"][number] | null;
}

type DesignationTier = "gateway" | "professional" | "executive" | null;

interface TierMeta {
  ribbonClasses: string;
  stripeClasses: string;
}

function getTierMeta(tier: DesignationTier): TierMeta {
  switch (tier) {
    case "gateway":
      return {
        ribbonClasses: "from-brand-300/30 via-transparent",
        stripeClasses: "from-brand-300 to-brand-500",
      };
    case "executive":
      return {
        ribbonClasses: "from-brand-700/40 via-transparent",
        stripeClasses: "from-brand-700 to-brand-900",
      };
    case "professional":
    default:
      return {
        ribbonClasses: "from-brand-500/35 via-transparent",
        stripeClasses: "from-brand-500 to-brand-700",
      };
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const HOLDER_QUERY = `
  id,
  member_number,
  certified_at,
  registry_company,
  registry_company_ar,
  registry_title,
  registry_title_ar,
  status,
  tier:designation_tiers!designation_holders_tier_id_fkey(
    name, name_ar, slug, badge_url
  ),
  profile:profiles!designation_holders_user_id_fkey(
    full_name
  )
` as const;

async function fetchHoldersPage(designationId: string, offset: number) {
  const supabase = createClient();
  return await supabase
    .from("designation_holders")
    .select(HOLDER_QUERY, { count: "exact" })
    .eq("designation_id", designationId)
    .in("status", ["active", "grace_period"])
    .eq("show_in_registry", true)
    .order("certified_at", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
}

function mapHolders(data: unknown[] | null): RegistryHolder[] {
  return (data ?? []).map((item) => {
    const raw = item as RegistryHolderRaw;
    return {
      ...raw,
      tier: raw.tier?.[0] ?? null,
      profile: raw.profile?.[0] ?? null,
    } as RegistryHolder;
  });
}

export default function DesignationRegistryPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const isAr = locale === "ar";
  const prefersReducedMotion = useReducedMotion();

  const [designation, setDesignation] = useState<DesignationInfo | null>(null);
  const [holders, setHolders] = useState<RegistryHolder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: desig } = await supabase
        .from("designations")
        .select("id, name, name_ar, abbreviation, slug, metadata")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!desig) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setDesignation(desig as DesignationInfo);

      const { data, count } = await fetchHoldersPage(desig.id, 0);
      setHolders(mapHolders(data));
      setTotalCount(count ?? 0);
      setIsLoading(false);
    }

    fetchData();
  }, [slug]);

  async function loadMore() {
    if (!designation || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { data } = await fetchHoldersPage(designation.id, holders.length);
      setHolders((prev) => [...prev, ...mapHolders(data)]);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const filteredHolders = useMemo(() => {
    let results = holders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter((h) => {
        const name = h.profile?.full_name?.toLowerCase() ?? "";
        const company = (h.registry_company ?? "").toLowerCase();
        const companyAr = (h.registry_company_ar ?? "").toLowerCase();
        const memberNum = (h.member_number ?? "").toLowerCase();
        return (
          name.includes(q) ||
          company.includes(q) ||
          companyAr.includes(q) ||
          memberNum.includes(q)
        );
      });
    }

    if (tierFilter !== "all") {
      results = results.filter((h) => h.tier?.slug === tierFilter);
    }

    return results;
  }, [holders, searchQuery, tierFilter]);

  const foundingCount = useMemo(
    () => holders.filter((h) => h.tier?.slug === "founding-member").length,
    [holders]
  );

  /** Tier dropdown options derived from what's actually in the registry,
   *  so designations with custom tiers (associate, fellow, etc.) are
   *  filterable instead of being silently dropped. */
  const tierOptions = useMemo(() => {
    const seen = new Map<string, { slug: string; name: string; name_ar: string | null }>();
    for (const h of holders) {
      if (h.tier?.slug && !seen.has(h.tier.slug)) {
        seen.set(h.tier.slug, {
          slug: h.tier.slug,
          name: h.tier.name,
          name_ar: h.tier.name_ar,
        });
      }
    }
    return Array.from(seen.values());
  }, [holders]);

  function resetFilters() {
    setSearchQuery("");
    setTierFilter("all");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound || !designation) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold">
          {isAr ? "التسمية غير موجودة" : "Designation Not Found"}
        </h2>
      </div>
    );
  }

  const tierRaw = designation.metadata?.tier_level;
  const tierLevel: DesignationTier =
    tierRaw === "gateway" || tierRaw === "professional" || tierRaw === "executive"
      ? tierRaw
      : null;
  const tierMeta = getTierMeta(tierLevel);

  return (
    <div className="pb-24">
      {/* Editorial dark hero — same language as DesignationHero */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${tierMeta.ribbonClasses} to-transparent`}
        />

        {!prefersReducedMotion ? (
          <>
            <motion.div
              aria-hidden
              className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl"
              animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.3, 0.18] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="absolute -left-32 top-[-120px] -z-10 h-[420px] w-[420px] rounded-full bg-brand-400/30 blur-3xl opacity-30"
            />
            <div
              aria-hidden
              className="absolute right-[-180px] bottom-[-160px] -z-10 h-[480px] w-[480px] rounded-full bg-brand-600/30 blur-3xl opacity-25"
            />
          </>
        )}

        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />

        <div className="container relative z-10 mx-auto px-4 pt-10 pb-24 sm:pt-14 sm:pb-32">
          {/* Back link */}
          <Link
            href={`/${locale}/designations/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? "rotate-180" : ""}`} />
            {isAr ? `العودة إلى ${designation.abbreviation}` : `Back to ${designation.abbreviation}`}
          </Link>

          {/* Eyebrow */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            <span>VIFM</span>
            <span className="hidden h-px w-8 bg-white/20 sm:block" />
            <span>{isAr ? "السجل العام" : "Public Registry"}</span>
            <span className="hidden h-px w-8 bg-white/20 sm:block" />
            <span className="inline-flex items-center gap-1.5 text-brand-200/80">
              <Shield className="h-3 w-3" />
              {isAr ? "تحقق من الشهادة" : "Credential Verification"}
            </span>
          </div>

          <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:items-end">
            {/* Left — title + intro */}
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-medium text-brand-200">
                <Award className="h-3.5 w-3.5" />
                {designation.abbreviation}
              </div>

              <h1
                className="mt-5 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]"
                dir={isAr ? "rtl" : undefined}
              >
                <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                  {isAr
                    ? `سجل ${designation.abbreviation} العام`
                    : `${designation.abbreviation} Public Registry`}
                </span>
              </h1>

              <p
                className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
                dir={isAr ? "rtl" : undefined}
              >
                {isAr
                  ? `تحقق من حالة شهادة أي محترف ${designation.abbreviation}. ابحث بالاسم أو الشركة أو رقم العضوية.`
                  : `Verify the certification status of any ${designation.abbreviation} professional. Search by name, company, or member number.`}
              </p>
            </div>

            {/* Right — glass tile with stats */}
            <div className="lg:col-span-4">
              <div className="relative">
                <div
                  aria-hidden
                  className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${tierMeta.stripeClasses} opacity-30 blur-2xl`}
                />
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
                  <div className="p-6">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                      {isAr ? "إجمالي الأعضاء النشطين" : "Active Members"}
                    </p>

                    <p className="mt-2 font-heading text-5xl font-bold leading-none">
                      {fmtCount(totalCount, locale)}
                    </p>
                    <p className="mt-1 text-xs text-white/75">
                      {isAr
                        ? `محترف ${designation.abbreviation} نشط`
                        : `Active ${designation.abbreviation} professionals`}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                      {foundingCount > 0 && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                            {isAr ? "أعضاء مؤسسون" : "Founding"}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 text-amber-300" />
                            {fmtCount(foundingCount, locale)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                          {isAr ? "تم التحقق" : "Verified"}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold">
                          <BadgeCheck className="h-3.5 w-3.5 text-brand-300" />
                          100%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container mx-auto px-4">
        {/* Search + filter card, lifted over the hero edge */}
        <div className="relative -mt-20 sm:-mt-24">
          <div className="rounded-2xl border bg-white/95 p-4 shadow-xl shadow-brand-950/10 backdrop-blur-md sm:p-5 dark:bg-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                    isAr ? "right-3" : "left-3"
                  }`}
                />
                <input
                  type="text"
                  aria-label={
                    isAr
                      ? "ابحث في السجل بالاسم أو الشركة أو رقم العضوية"
                      : "Search the registry by name, company, or member number"
                  }
                  placeholder={
                    isAr
                      ? "ابحث بالاسم أو الشركة أو رقم العضوية..."
                      : "Search by name, company, or member number..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  dir={isAr ? "rtl" : undefined}
                  className={`w-full rounded-xl border bg-background py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                    isAr ? "pr-10 pl-4" : "pl-10 pr-4"
                  }`}
                />
              </div>
              <select
                aria-label={isAr ? "تصفية حسب المستوى" : "Filter by tier"}
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                disabled={tierOptions.length === 0}
                className="rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="all">{isAr ? "جميع المستويات" : "All Tiers"}</option>
                {tierOptions.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>
                    {isAr && opt.name_ar ? opt.name_ar : opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {isAr
                  ? `عرض ${fmtCount(filteredHolders.length, locale)} من ${fmtCount(totalCount, locale)}`
                  : `Showing ${fmtCount(filteredHolders.length, locale)} of ${fmtCount(totalCount, locale)}`}
              </span>
              {(searchQuery || tierFilter !== "all") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-brand-600 hover:text-brand-700 hover:underline"
                >
                  {isAr ? "إعادة تعيين" : "Reset filters"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10">
          {filteredHolders.length === 0 ? (
            totalCount === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed bg-gradient-to-br from-brand-50/60 to-white px-6 py-20 text-center dark:from-brand-950/40 dark:to-card">
                <div className="rounded-full bg-brand-100/70 p-4 dark:bg-brand-900/40">
                  <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-300" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold">
                  {isAr
                    ? `سجل ${designation.abbreviation} على وشك الافتتاح`
                    : `${designation.abbreviation} registry is just getting started`}
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {isAr
                    ? "كن من بين أوائل المحترفين المعتمدين. سيظهر الحاملون الجدد هنا فور إكمال الشهادة."
                    : "Be among the first certified professionals. New holders will appear here as soon as they complete the program."}
                </p>
                <Link href={`/${locale}/designations/${slug}`} className="mt-6">
                  <Button size="sm">
                    <Award className="mr-2 h-4 w-4" />
                    {isAr ? "ابدأ الشهادة" : "Start Certification"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  {isAr ? "لم يتم العثور على نتائج" : "No results found"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {isAr
                    ? "حاول تعديل بحثك أو إعادة تعيين عوامل التصفية."
                    : "Try adjusting your search or reset the filters to see all members."}
                </p>
                {(searchQuery || tierFilter !== "all") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-5"
                    onClick={resetFilters}
                  >
                    {isAr ? "إعادة تعيين عوامل التصفية" : "Reset filters"}
                  </Button>
                )}
              </div>
            )
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHolders.map((holder) => {
                const company =
                  isAr && holder.registry_company_ar
                    ? holder.registry_company_ar
                    : holder.registry_company;
                const title =
                  isAr && holder.registry_title_ar
                    ? holder.registry_title_ar
                    : holder.registry_title;
                const tierName =
                  isAr && holder.tier?.name_ar
                    ? holder.tier.name_ar
                    : holder.tier?.name;
                const isFoundingMember = holder.tier?.slug === "founding-member";
                const certifiedDate = new Date(holder.certified_at).toLocaleDateString(
                  isAr ? "ar-SA" : "en-US",
                  { year: "numeric", month: "short" }
                );

                return (
                  <li key={holder.id}>
                    <Link
                      href={`/${locale}/designations/${slug}/verify/${holder.member_number}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/10"
                    >
                      {/* Founding-member gold accent */}
                      {isFoundingMember && (
                        <div
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"
                        />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isFoundingMember
                              ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900"
                              : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          {getInitials(holder.profile?.full_name)}
                          {isFoundingMember && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow ring-2 ring-card">
                              <Sparkles className="h-3 w-3" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold leading-tight">
                            {holder.profile?.full_name ?? "—"}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            {holder.member_number}
                          </p>
                        </div>

                        {isFoundingMember && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                            <Star className="h-3 w-3" />
                            {tierName}
                          </span>
                        )}
                      </div>

                      {(company || title) && (
                        <div className="mt-4 space-y-1.5 text-sm">
                          {title && (
                            <p className="truncate font-medium text-foreground">
                              {title}
                            </p>
                          )}
                          {company && (
                            <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              {company}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />
                          {isAr ? `منذ ${certifiedDate}` : `Since ${certifiedDate}`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-brand-600 transition-colors group-hover:text-brand-700">
                          {isAr ? "تحقق" : "Verify"}
                          <ExternalLink className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 ${isAr ? "rotate-180" : ""}`} />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Server-side pagination — only shown when there are more rows in
              the DB than we've loaded. Hidden during active filtering since
              filtering operates on already-loaded data. */}
          {holders.length < totalCount && !searchQuery && tierFilter === "all" && (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isAr ? "جارٍ التحميل..." : "Loading..."}
                  </>
                ) : (
                  <>
                    {isAr
                      ? `تحميل المزيد (${fmtCount(totalCount - holders.length, locale)})`
                      : `Load more (${fmtCount(totalCount - holders.length, locale)})`}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* When the user is searching/filtering and we haven't loaded
              everything, hint that more results may exist server-side. */}
          {holders.length < totalCount && (searchQuery || tierFilter !== "all") && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {isAr
                ? `يتم البحث في ${fmtCount(holders.length, locale)} من ${fmtCount(totalCount, locale)} عضوًا محملًا. حمّل المزيد للبحث في السجل بأكمله.`
                : `Searching across ${fmtCount(holders.length, locale)} of ${fmtCount(totalCount, locale)} loaded members. Clear filters and load more to search the full registry.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
