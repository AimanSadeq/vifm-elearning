"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Search,
  User,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/**
 * Slim header for admin/instructor/corporate consoles.
 * No public marketing nav, no mega menus — just logo, "View Site",
 * search, language, notifications, user menu.
 */
export function AdminHeader({
  dashboardHref,
}: {
  /** Where the logo and the user-menu "Dashboard" link point to. Defaults to /admin/dashboard. */
  dashboardHref?: string;
}) {
  const locale = useLocale();
  const { user, signOut, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const dashHref = dashboardHref ?? `/${locale}/admin/dashboard`;

  return (
    <Fragment>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-20 items-center justify-between px-4">
          <Link href={dashHref} className="flex items-center">
            <Image
              src="/images/vifm-logo.png"
              alt="VIFM — Admin"
              width={240}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}`}
              className="hidden md:inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Site
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <LanguageSwitcher />
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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute end-0 top-full z-50 mt-1 w-56 rounded-md border bg-background py-1 shadow-lg">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href={dashHref}
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
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <GlobalSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </Fragment>
  );
}
