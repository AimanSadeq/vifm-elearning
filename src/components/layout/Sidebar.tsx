"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Bell,
  User,
  Users,
  BarChart3,
  Key,
  Receipt,
  MessageSquare,
  Video,
  Building2,
  CreditCard,
  Trophy,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
}

function getNavItems(role: UserRole, t: (key: string) => string): NavItem[] {
  switch (role) {
    case "learner":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/my-courses" },
        { icon: Route, label: "Learning Paths", href: "/my-learning-paths" },
        { icon: Award, label: t("dashboard.certificates"), href: "/certificates" },
        { icon: CreditCard, label: "Subscription", href: "/subscription" },
        { icon: Bell, label: t("notifications.title"), href: "/notifications" },
        { icon: User, label: "Profile", href: "/profile" },
      ];
    case "corporate_admin":
      return [
        { icon: LayoutDashboard, label: t("corporate.dashboard"), href: "/corporate/dashboard" },
        { icon: Users, label: t("corporate.employees"), href: "/corporate/employees" },
        { icon: BarChart3, label: t("corporate.teamProgress"), href: "/corporate/reports" },
        { icon: Key, label: t("corporate.licenses"), href: "/corporate/licenses" },
        { icon: Receipt, label: t("corporate.invoices"), href: "/corporate/invoices" },
      ];
    case "instructor":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/instructor/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/instructor/courses" },
        { icon: MessageSquare, label: "Forums", href: "/instructor/forums" },
        { icon: BarChart3, label: t("admin.analytics"), href: "/instructor/analytics" },
      ];
    case "super_admin":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        {
          icon: BookOpen,
          label: t("admin.manageCourses"),
          href: "/admin/courses",
          children: [
            { label: "All Courses", href: "/admin/courses" },
            { label: "Create New", href: "/admin/courses/new" },
            { label: "Categories", href: "/admin/categories" },
            { label: "Learning Paths", href: "/admin/learning-paths" },
          ],
        },
        {
          icon: Shield,
          label: t("admin.manageCertifications"),
          href: "/admin/certifications",
          children: [
            { label: t("admin.allCertifications"), href: "/admin/certifications" },
            { label: t("admin.createCertification"), href: "/admin/certifications/new" },
          ],
        },
        { icon: Video, label: t("admin.manageWebinars"), href: "/admin/webinars" },
        { icon: Users, label: t("admin.manageUsers"), href: "/admin/users" },
        { icon: Building2, label: t("admin.manageOrganizations"), href: "/admin/organizations" },
        {
          icon: CreditCard,
          label: t("admin.managePayments"),
          href: "/admin/payments",
          children: [
            { label: "Transactions", href: "/admin/payments" },
            { label: "Invoices", href: "/admin/payments/invoices" },
            { label: "Promo Codes", href: "/admin/promo-codes" },
            { label: "Vouchers", href: "/admin/vouchers" },
            { label: "Subscriptions", href: "/admin/subscriptions" },
          ],
        },
        {
          icon: Award,
          label: t("admin.manageCertificates"),
          href: "/admin/certificates",
          children: [
            { label: "All Certificates", href: "/admin/certificates" },
            { label: "Templates", href: "/admin/certificates/templates" },
          ],
        },
        {
          icon: BarChart3,
          label: t("admin.analytics"),
          href: "/admin/analytics",
          children: [
            { label: "Overview", href: "/admin/analytics" },
            { label: "Revenue", href: "/admin/analytics/revenue" },
            { label: "Learners", href: "/admin/analytics/learners" },
            { label: "Courses", href: "/admin/analytics/courses" },
          ],
        },
        { icon: Trophy, label: t("admin.badges"), href: "/admin/badges" },
        { icon: MessageSquare, label: "Testimonials", href: "/admin/testimonials" },
        { icon: Bell, label: t("admin.notifications"), href: "/admin/notifications" },
        { icon: Settings, label: t("admin.settings"), href: "/admin/settings" },
      ];
    default:
      return [];
  }
}

function SidebarItem({
  item,
  locale,
  collapsed,
}: {
  item: NavItem;
  locale: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const fullHref = `/${locale}${item.href}`;
  const isActive =
    pathname === fullHref ||
    (item.children &&
      item.children.some((c) => pathname === `/${locale}${c.href}`));

  if (item.children) {
    if (collapsed) {
      return (
        <Link
          href={fullHref}
          title={item.label}
          className={cn(
            "flex items-center justify-center rounded-md p-2 transition-colors",
            isActive
              ? "bg-brand-50 text-brand-700"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
        </Link>
      );
    }

    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-brand-50 text-brand-700"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="ms-7 mt-1 flex flex-col gap-0.5">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={`/${locale}${child.href}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === `/${locale}${child.href}`
                    ? "text-brand-700 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (collapsed) {
    return (
      <Link
        href={fullHref}
        title={item.label}
        className={cn(
          "flex items-center justify-center rounded-md p-2 transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={fullHref}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const locale = useLocale();
  const t = useTranslations();
  const navItems = getNavItems(role, t);

  return (
    <aside
      className={cn(
        "sidebar hidden md:flex flex-col border-e bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-[width] duration-200",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
    >
      <div className={cn("border-b", collapsed ? "p-2" : "p-4 pb-2")}>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
            collapsed ? "justify-center p-2 w-full" : "gap-3 px-3 py-2 w-full"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      <nav className={cn("flex flex-col gap-1 flex-1", collapsed ? "p-2" : "p-4")}>
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            locale={locale}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
}
