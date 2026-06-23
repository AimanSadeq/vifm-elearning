"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFeatureFlags } from "@/lib/hooks/useFeatureFlags";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const featureFlags = useFeatureFlags();
  const year = new Date().getFullYear();

  const [appUrls, setAppUrls] = useState<{
    appStore: string;
    googlePlay: string;
  }>({ appStore: "", googlePlay: "" });

  useEffect(() => {
    fetch("/api/site-settings/public")
      .then((r) => r.json())
      .then((j) =>
        setAppUrls({
          appStore: String(j.data?.footer_app_store_url ?? ""),
          googlePlay: String(j.data?.footer_google_play_url ?? ""),
        }),
      )
      .catch(() => {});
  }, []);

  const showApps = appUrls.appStore || appUrls.googlePlay;

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

            {/* App badges — hidden until at least one URL is configured. */}
            {showApps && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-400">
                  {t("getTheApp")}
                </p>
                <div className="mt-2 flex gap-2">
                  {appUrls.appStore && (
                    <a
                      href={appUrls.appStore}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.08] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <div className="leading-none">
                        <span className="block text-[9px] text-brand-400">{t("downloadOn")}</span>
                        <span className="block text-xs font-medium text-white">App Store</span>
                      </div>
                    </a>
                  )}

                  {appUrls.googlePlay && (
                    <a
                      href={appUrls.googlePlay}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.08] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z" />
                      </svg>
                      <div className="leading-none">
                        <span className="block text-[9px] text-brand-400">{t("getItOn")}</span>
                        <span className="block text-xs font-medium text-white">Google Play</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
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
              {featureFlags.subscriptions && (
                <li>
                  <Link
                    href={`/${locale}/pricing`}
                    className="text-sm text-brand-300 hover:text-white transition-colors"
                  >
                    {tc("pricing")}
                  </Link>
                </li>
              )}
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
                  href={`/${locale}/privacy-policy`}
                  className="text-sm text-brand-300 hover:text-white transition-colors"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms-of-service`}
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
