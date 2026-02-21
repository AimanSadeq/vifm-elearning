"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Settings, LayoutDashboard, User, LogOut } from "lucide-react";
import type { Profile } from "@/types";

interface MobileNavProps {
  links: Array<{ href: string; label: string }>;
  locale: string;
  user: Profile | null;
  dashboardHref: string;
  onClose: () => void;
  onSignOut: () => void;
}

export function MobileNav({ links, locale, user, dashboardHref, onClose, onSignOut }: MobileNavProps) {
  const t = useTranslations("common");

  return (
    <div className="md:hidden border-t bg-background">
      <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <hr className="my-2" />
        {user ? (
          <>
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Link
              href={dashboardHref}
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href={`/${locale}/profile`}
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-error hover:bg-error/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/${locale}/login`}
              onClick={onClose}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href={`/${locale}/register`}
              onClick={onClose}
              className="rounded-md bg-brand-600 px-3 py-2.5 text-sm font-medium text-white text-center hover:bg-brand-700 transition-colors"
            >
              {t("register")}
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
