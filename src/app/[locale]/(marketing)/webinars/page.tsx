"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Radio,
  Video,
  Calendar,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WebinarCard } from "@/components/webinars/WebinarCard";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Webinar } from "@/types";

type Tab = "upcoming" | "past";

const PAGE_SIZE = 12;

export default function WebinarsPage() {
  const tc = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const initialTab: Tab = useMemo(() => {
    const t = searchParams.get("tab");
    return t === "past" ? "past" : "upcoming";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialPrice: "all" | "free" | "paid" = useMemo(() => {
    const p = searchParams.get("price");
    return p === "free" || p === "paid" ? p : "all";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialSearch = useMemo(
    () => searchParams.get("q") ?? searchParams.get("search") ?? "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // If the user arrived from "Upcoming Sessions" we respect that even if there
  // are no upcoming webinars (auto-switch logic below only kicks in when tab is default).
  const userSpecifiedTab = useMemo(
    () => searchParams.has("tab"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [upcoming, setUpcoming] = useState<Webinar[]>([]);
  const [past, setPast] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">(initialPrice);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    let cancelled = false;
    async function fetchWebinars() {
      const supabase = createClient();
      const now = new Date().toISOString();

      const [upcomingRes, pastRes] = await Promise.all([
        supabase
          .from("webinars")
          .select(
            `*, instructor:profiles!webinars_instructor_id_fkey(full_name, full_name_ar)`
          )
          .in("status", ["scheduled", "live"])
          .gte("scheduled_at", now)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("webinars")
          .select(
            `*, instructor:profiles!webinars_instructor_id_fkey(full_name, full_name_ar)`
          )
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setUpcoming((upcomingRes.data as Webinar[]) ?? []);
      setPast((pastRes.data as Webinar[]) ?? []);
      setIsLoading(false);

      // Auto-switch to "past" only when the user hasn't explicitly picked a tab
      // via the URL and there's nothing in "upcoming" to show.
      if (
        !userSpecifiedTab &&
        (upcomingRes.data?.length ?? 0) === 0 &&
        (pastRes.data?.length ?? 0) > 0
      ) {
        setTab("past");
      }
    }
    fetchWebinars();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter helper
  const matches = (w: Webinar) => {
    const s = debouncedSearch.trim().toLowerCase();
    if (s) {
      const hay = [
        w.title,
        w.title_ar,
        w.description,
        w.description_ar,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (priceFilter === "free" && !w.is_free) return false;
    if (priceFilter === "paid" && w.is_free) return false;
    return true;
  };

  const filteredUpcoming = useMemo(
    () => upcoming.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upcoming, debouncedSearch, priceFilter]
  );
  const filteredPast = useMemo(
    () => past.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [past, debouncedSearch, priceFilter]
  );

  // Reset page when filters / tab change
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, priceFilter]);

  const activeList = tab === "upcoming" ? filteredUpcoming : filteredPast;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const paginated = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const liveNow = upcoming.filter((w) => w.status === "live");
  const totalUpcoming = upcoming.length;
  const totalPast = past.length;
  const totalFree = [...upcoming, ...past].filter((w) => w.is_free).length;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, rgba(83,145,213,0.28), transparent 40%), radial-gradient(circle at 85% 75%, rgba(184,84,28,0.15), transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container relative mx-auto px-4 py-14 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
            <Radio className="h-3 w-3 text-brand-400" />
            {locale === "ar" ? "ندوات عبر الإنترنت" : "Live & On-Demand"}
          </span>
          <h1 className="mt-5 font-heading text-3xl md:text-5xl font-bold leading-tight">
            {locale === "ar"
              ? "ندواتنا حضور مباشر أو إعادة مشاهدة"
              : "Expert-led webinars, anywhere"}
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-white/75 text-base md:text-lg">
            {locale === "ar"
              ? "انضم إلى جلسات مباشرة مع خبراء الصناعة، أو شاهد تسجيلات ندوات سابقة في وقتك الخاص."
              : "Join live sessions with industry experts, or watch past recordings at your own pace."}
          </p>

          {/* Live pulse strip */}
          {liveNow.length > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {locale === "ar"
                ? `${liveNow.length} ندوة مباشرة الآن`
                : `${liveNow.length} live now join`}
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/85">
            <Stat
              icon={<Radio className="h-4 w-4" />}
              value={totalUpcoming}
              label={locale === "ar" ? "قادمة" : "Upcoming"}
            />
            <span className="hidden sm:block h-4 w-px bg-white/20" />
            <Stat
              icon={<Video className="h-4 w-4" />}
              value={totalPast}
              label={locale === "ar" ? "إعادة مشاهدة" : "Past replays"}
            />
            <span className="hidden sm:block h-4 w-px bg-white/20" />
            <Stat
              icon={<Sparkles className="h-4 w-4" />}
              value={totalFree}
              label={locale === "ar" ? "مجاناً" : "Free"}
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container mx-auto px-4 py-10">
        {/* Tabs + Filters bar */}
        <div className="mb-6 rounded-2xl border bg-card p-4 shadow-card space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b">
            <TabButton
              active={tab === "upcoming"}
              onClick={() => setTab("upcoming")}
              icon={<Radio className="h-4 w-4" />}
              label={locale === "ar" ? "قادمة" : "Upcoming"}
              count={filteredUpcoming.length}
            />
            <TabButton
              active={tab === "past"}
              onClick={() => setTab("past")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={locale === "ar" ? "سابقة" : "Past"}
              count={filteredPast.length}
            />
          </div>

          {/* Search + price */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "ابحث عن ندوة..."
                    : "Search webinars..."
                }
                className="w-full rounded-lg border bg-background ps-10 pe-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PillButton
                active={priceFilter === "all"}
                onClick={() => setPriceFilter("all")}
              >
                {locale === "ar" ? "الكل" : "All"}
              </PillButton>
              <PillButton
                active={priceFilter === "free"}
                onClick={() => setPriceFilter("free")}
              >
                {locale === "ar" ? "مجاني" : "Free"}
              </PillButton>
              <PillButton
                active={priceFilter === "paid"}
                onClick={() => setPriceFilter("paid")}
              >
                {locale === "ar" ? "مدفوع" : "Paid"}
              </PillButton>
            </div>
          </div>
        </div>

        {/* Result summary */}
        {!isLoading && (
          <div className="mb-5 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {locale === "ar"
                ? `${activeList.length} ${
                    tab === "upcoming" ? "ندوة قادمة" : "ندوة سابقة"
                  }`
                : `${activeList.length} ${
                    tab === "upcoming" ? "upcoming" : "past"
                  } ${activeList.length === 1 ? "webinar" : "webinars"}`}
            </p>
            {(search || priceFilter !== "all") && (
              <button
                type="button"
                className="text-brand-600 hover:text-brand-700 font-medium"
                onClick={() => {
                  setSearch("");
                  setPriceFilter("all");
                }}
              >
                {locale === "ar" ? "إعادة تعيين" : "Reset filters"}
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border bg-card shadow-card"
              >
                <div className="aspect-[16/10] bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <EmptyState
            tab={tab}
            hasFilters={Boolean(search || priceFilter !== "all")}
            locale={locale}
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {tc("previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {tc("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-brand-400">{icon}</span>
      <span className="font-semibold">{value}</span>
      <span className="text-white/70">{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "text-brand-700"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      <span
        className={`ms-1 inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full px-1.5 text-[11px] font-semibold ${
          active
            ? "bg-brand-100 text-brand-700"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
      {active && (
        <span
          aria-hidden
          className="absolute start-0 end-0 bottom-0 h-0.5 bg-brand-600"
        />
      )}
    </button>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-brand-600 bg-brand-600 text-white shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground hover:bg-brand-50/60"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  tab,
  hasFilters,
  locale,
}: {
  tab: Tab;
  hasFilters: boolean;
  locale: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-5">
        {tab === "upcoming" ? (
          <Calendar className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Video className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-heading text-xl font-semibold">
        {hasFilters
          ? locale === "ar"
            ? "لا توجد نتائج"
            : "No results"
          : tab === "upcoming"
          ? locale === "ar"
            ? "لا توجد ندوات قادمة حالياً"
            : "No upcoming webinars yet"
          : locale === "ar"
          ? "لا توجد ندوات سابقة"
          : "No past webinars"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        {hasFilters
          ? locale === "ar"
            ? "جرّب تعديل البحث أو إعادة تعيين الفلاتر."
            : "Try adjusting your search or clearing filters."
          : tab === "upcoming"
          ? locale === "ar"
            ? "سيتم نشر الندوات القادمة هنا يمكنك تصفّح الإعادات في الأثناء."
            : "New webinars will appear here. In the meantime, browse the past replays."
          : ""}
      </p>
    </div>
  );
}

