"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu, X, LogOut, User, LayoutDashboard, Search,
  ChevronDown, BookOpen, Award, Radio, TrendingUp, Building2, Mail,
  ArrowRight, Sparkles, Clock, Video,
} from "lucide-react";
import { iconForCategory } from "@/lib/utils/category-icon";
import { useState, useRef, useCallback, useEffect, Fragment } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";
import { createClient } from "@/lib/supabase/client";
import { DESIGNATION_TIERS } from "@/lib/site-content";
import { cn } from "@/lib/utils/cn";
import { MobileNav } from "./MobileNav";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type MenuId = "home" | "courses" | "certifications" | "webinars" | null;

interface HeaderCategory {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  slug: string;
  icon: string;
  color: string;
}

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const featureFlags = useFeatureFlags();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuId>(null);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut, isLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("categories")
      .select("name, name_ar, description, description_ar, slug, icon, color")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return;
        setCategories(
          data.map((c) => ({
            name: c.name,
            nameAr: c.name_ar?.trim() ? c.name_ar : c.name,
            description: c.description ?? "",
            descriptionAr: c.description_ar?.trim() ? c.description_ar : c.description ?? "",
            slug: c.slug,
            icon: c.icon ?? "",
            color: c.color ?? "#1E3A5F",
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openMenu = useCallback((id: MenuId) => {
    if (menuTimer.current) clearTimeout(menuTimer.current);
    setActiveMenu(id);
  }, []);

  const closeMenu = useCallback(() => {
    menuTimer.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  const closeMenuNow = useCallback(() => {
    if (menuTimer.current) clearTimeout(menuTimer.current);
    setActiveMenu(null);
  }, []);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/courses`, label: t("courses") },
    { href: `/${locale}/designations`, label: t("certifications") },
    { href: `/${locale}/webinars`, label: t("webinars") },
    // Pricing sells subscription plans — hide it when subscriptions are off.
    ...(featureFlags.subscriptions
      ? [{ href: `/${locale}/pricing`, label: t("pricing") }]
      : []),
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const MENU_IDS: Record<string, MenuId> = {
    [`/${locale}`]: "home",
    [`/${locale}/courses`]: "courses",
    [`/${locale}/designations`]: "certifications",
    [`/${locale}/webinars`]: "webinars",
  };

  const getDashboardHref = () => {
    if (!user) return `/${locale}/dashboard`;
    switch (user.role) {
      case "super_admin":
        return `/${locale}/admin/dashboard`;
      case "instructor":
        return `/${locale}/instructor/dashboard`;
      case "corporate_admin":
        return `/${locale}/corporate/dashboard`;
      default:
        return `/${locale}/dashboard`;
    }
  };

  return (
    <Fragment>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/images/vifm-logo.png"
            alt="VIFM - Virginia Institute of Finance and Management"
            width={120}
            height={40}
            className="h-13 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const menuId = MENU_IDS[link.href];
            if (menuId) {
              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => openMenu(menuId)}
                  onMouseLeave={closeMenu}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activeMenu === menuId
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        activeMenu === menuId && "rotate-180"
                      )}
                    />
                  </Link>

                  {/* Mega menu dropdown anchored to this nav item */}
                  {activeMenu === menuId && (
                    <div className="absolute start-0 top-full z-50 hidden pt-1 md:block">
                      <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
                        {menuId === "home" && (
                          <div className="grid grid-cols-[220px_300px_300px]">
                            <BrandedPanel
                              tagline={t("megaMenuTagline")}
                              title="VIFM Academy"
                              desc={t("megaMenuDesc")}
                              ctaText={t("register")}
                              ctaHref={`/${locale}/register`}
                              onClose={closeMenuNow}
                            />
                            <div className="border-e border-border/50 p-6">
                              <MenuSectionLabel>{t("megaMenuCategories")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {categories.map((cat) => {
                                  const Icon = iconForCategory(cat.slug, cat.name);
                                  const desc = locale === "ar" ? cat.descriptionAr : cat.description;
                                  return (
                                    <MenuLink key={cat.slug} href={`/${locale}/categories/${cat.slug}`} onClose={closeMenuNow}>
                                      <MenuIcon style={{ backgroundColor: `${cat.color}15` }}>
                                        <Icon className="h-4 w-4" style={{ color: cat.color }} />
                                      </MenuIcon>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{locale === "ar" ? cat.nameAr : cat.name}</p>
                                        {desc && (
                                          <p className="truncate text-xs text-muted-foreground/70">{desc}</p>
                                        )}
                                      </div>
                                    </MenuLink>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="p-6">
                              <MenuSectionLabel>{t("megaMenuQuickLinks")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {[
                                  { href: `/${locale}/courses`, icon: BookOpen, label: t("megaMenuCourses"), desc: t("megaMenuCoursesDesc") },
                                  { href: `/${locale}/designations`, icon: Award, label: t("megaMenuCertifications"), desc: t("megaMenuCertificationsDesc") },
                                  { href: `/${locale}/webinars`, icon: Radio, label: t("megaMenuWebinars"), desc: t("megaMenuWebinarsDesc") },
                                  { href: `/${locale}/designations`, icon: TrendingUp, label: t("megaMenuCareer"), desc: t("megaMenuCareerDesc") },
                                  { href: `/${locale}/about`, icon: Building2, label: t("megaMenuAbout"), desc: t("megaMenuAboutDesc") },
                                  { href: `/${locale}/contact`, icon: Mail, label: t("megaMenuContact"), desc: t("megaMenuContactDesc") },
                                ].map((link) => (
                                  <MenuLink key={link.href + link.label} href={link.href} onClose={closeMenuNow}>
                                    <MenuIcon className="bg-secondary text-muted-foreground group-hover:text-brand-600">
                                      <link.icon className="h-4 w-4" />
                                    </MenuIcon>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{link.label}</p>
                                      <p className="truncate text-xs text-muted-foreground/70">{link.desc}</p>
                                    </div>
                                  </MenuLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {menuId === "courses" && (
                          <div className="grid grid-cols-[220px_300px_280px]">
                            <BrandedPanel
                              tagline={t("courseMenuTagline")}
                              title={t("courses")}
                              desc={t("courseMenuDesc")}
                              ctaText={t("courseMenuAllCourses")}
                              ctaHref={`/${locale}/courses`}
                              onClose={closeMenuNow}
                            />
                            <div className="border-e border-border/50 p-6">
                              <MenuSectionLabel>{t("megaMenuCategories")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {categories.map((cat) => {
                                  const Icon = iconForCategory(cat.slug, cat.name);
                                  const desc = locale === "ar" ? cat.descriptionAr : cat.description;
                                  return (
                                    <MenuLink key={cat.slug} href={`/${locale}/categories/${cat.slug}`} onClose={closeMenuNow}>
                                      <MenuIcon style={{ backgroundColor: `${cat.color}15` }}>
                                        <Icon className="h-4 w-4" style={{ color: cat.color }} />
                                      </MenuIcon>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{locale === "ar" ? cat.nameAr : cat.name}</p>
                                        {desc && (
                                          <p className="truncate text-xs text-muted-foreground/70">{desc}</p>
                                        )}
                                      </div>
                                    </MenuLink>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="p-6">
                              <MenuSectionLabel>{t("courses")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {[
                                  { href: `/${locale}/courses`, icon: BookOpen, label: t("courseMenuAllCourses"), desc: t("courseMenuAllCoursesDesc") },
                                  { href: `/${locale}/courses?price=free`, icon: Sparkles, label: t("courseMenuFree"), desc: t("courseMenuFreeDesc") },
                                  { href: `/${locale}/courses?sort=newest`, icon: Clock, label: t("courseMenuNew"), desc: t("courseMenuNewDesc") },
                                  { href: `/${locale}/courses?sort=popular`, icon: TrendingUp, label: t("courseMenuPopular"), desc: t("courseMenuPopularDesc") },
                                ].map((link) => (
                                  <MenuLink key={link.label} href={link.href} onClose={closeMenuNow}>
                                    <MenuIcon className="bg-secondary text-muted-foreground group-hover:text-brand-600">
                                      <link.icon className="h-4 w-4" />
                                    </MenuIcon>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{link.label}</p>
                                      <p className="truncate text-xs text-muted-foreground/70">{link.desc}</p>
                                    </div>
                                  </MenuLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {menuId === "certifications" && (
                          <div className="grid grid-cols-[240px_260px_260px]">
                            <BrandedPanel
                              tagline={t("certMenuTagline")}
                              title={t("certifications")}
                              desc={t("certMenuDesc")}
                              ctaText={t("certMenuAllCerts")}
                              ctaHref={`/${locale}/designations`}
                              onClose={closeMenuNow}
                            />
                            <div className="border-e border-border/50 p-6">
                              <MenuSectionLabel>{t("megaMenuCareer")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {DESIGNATION_TIERS.map((tier) => {
                                  const Icon = tier.icon;
                                  const label = locale === "ar" ? tier.labelAr : tier.label;
                                  const desc = locale === "ar" ? tier.descriptionAr : tier.description;
                                  return (
                                    <MenuLink key={tier.id} href={`/${locale}/designations`} onClose={closeMenuNow}>
                                      <MenuIcon style={{ backgroundColor: `${tier.accentColor}15` }}>
                                        <Icon className="h-4 w-4" style={{ color: tier.accentColor }} />
                                      </MenuIcon>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{label}</p>
                                        <p className="truncate text-xs text-muted-foreground/70">{desc}</p>
                                      </div>
                                    </MenuLink>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="p-6">
                              <MenuSectionLabel>{t("certifications")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                <MenuLink href={`/${locale}/designations`} onClose={closeMenuNow}>
                                  <MenuIcon className="bg-secondary text-muted-foreground group-hover:text-brand-600">
                                    <Award className="h-4 w-4" />
                                  </MenuIcon>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{t("certMenuAllCerts")}</p>
                                    <p className="truncate text-xs text-muted-foreground/70">{t("certMenuAllCertsDesc")}</p>
                                  </div>
                                </MenuLink>
                                <MenuLink href={`/${locale}/courses`} onClose={closeMenuNow}>
                                  <MenuIcon className="bg-secondary text-muted-foreground group-hover:text-brand-600">
                                    <BookOpen className="h-4 w-4" />
                                  </MenuIcon>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{t("megaMenuCourses")}</p>
                                    <p className="truncate text-xs text-muted-foreground/70">{t("megaMenuCoursesDesc")}</p>
                                  </div>
                                </MenuLink>
                              </div>
                            </div>
                          </div>
                        )}

                        {menuId === "webinars" && (
                          <div className="grid grid-cols-[240px_300px]">
                            <BrandedPanel
                              tagline={t("webinarMenuTagline")}
                              title={t("webinars")}
                              desc={t("webinarMenuDesc")}
                              ctaText={t("webinarMenuAll")}
                              ctaHref={`/${locale}/webinars`}
                              onClose={closeMenuNow}
                            />
                            <div className="p-6">
                              <MenuSectionLabel>{t("webinars")}</MenuSectionLabel>
                              <div className="mt-3 space-y-0.5">
                                {[
                                  { href: `/${locale}/webinars`, icon: Radio, label: t("webinarMenuAll"), desc: t("webinarMenuAllDesc") },
                                  { href: `/${locale}/webinars?tab=upcoming`, icon: Video, label: t("webinarMenuUpcoming"), desc: t("webinarMenuUpcomingDesc") },
                                  { href: `/${locale}/webinars?tab=past`, icon: Clock, label: t("webinarMenuPast"), desc: t("webinarMenuPastDesc") },
                                ].map((link) => (
                                  <MenuLink key={link.label} href={link.href} onClose={closeMenuNow}>
                                    <MenuIcon className="bg-secondary text-muted-foreground group-hover:text-brand-600">
                                      <link.icon className="h-4 w-4" />
                                    </MenuIcon>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{link.label}</p>
                                      <p className="truncate text-xs text-muted-foreground/70">{link.desc}</p>
                                    </div>
                                  </MenuLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          {user && <NotificationBell />}

          {isLoading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.full_name}
                </span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute end-0 top-full z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link
                      href={getDashboardHref()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="hidden md:inline-flex rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="hidden md:inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                {t("register")}
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-secondary"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <MobileNav
          links={navLinks}
          locale={locale}
          user={user}
          dashboardHref={getDashboardHref()}
          onClose={() => setMobileOpen(false)}
          onSignOut={signOut}
        />
      )}

    </header>

    {/* Global Search Overlay — rendered outside header to avoid backdrop-blur stacking context clipping */}
    <GlobalSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </Fragment>
  );
}

/* ── Reusable sub-components ── */

function BrandedPanel({
  tagline, title, desc, ctaText, ctaHref, onClose,
}: {
  tagline: string; title: string; desc: string; ctaText: string; ctaHref: string; onClose: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-s-xl bg-brand-950 p-8 text-white">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">{tagline}</p>
        <h3 className="mt-3 font-heading text-lg font-bold leading-snug">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-brand-300/70">{desc}</p>
        <Link
          href={ctaHref}
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          {ctaText}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  );
}

function MenuLink({
  href, onClose, children,
}: {
  href: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="group flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-secondary"
    >
      {children}
      <ArrowRight className="ms-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 rtl:rotate-180" />
    </Link>
  );
}

function MenuIcon({
  children, className, style,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors", className)}
      style={style}
    >
      {children}
    </div>
  );
}
