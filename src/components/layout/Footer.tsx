"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-brand-950 text-brand-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="/images/vifm-logo.png"
              alt="VIFM - Virginia Institute of Finance and Management"
              width={140}
              height={47}
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="mt-3 text-sm text-brand-300">{t("description")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
              {t("quickLinks")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {tc("courses")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/webinars`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {tc("webinars")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {tc("pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {tc("about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
              {t("support")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {t("helpCenter")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-white uppercase tracking-wider">
              {t("legal")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {t("termsOfService")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-800 pt-8 text-center">
          <p className="text-sm text-brand-400">
            {t("copyright", { year: String(year) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
