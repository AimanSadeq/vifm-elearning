"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface MobileNavProps {
  links: Array<{ href: string; label: string }>;
  locale: string;
  onClose: () => void;
}

export function MobileNav({ links, locale, onClose }: MobileNavProps) {
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
      </nav>
    </div>
  );
}
