import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Builds locale-aware Metadata for a marketing page from the `metadata.{key}`
 * namespace in messages/{locale}.json. Pulls `title` and `description`, and
 * sets the canonical + hreflang alternates so EN and AR pages cross-reference.
 */
export async function pageMetadata({
  locale,
  key,
  pathname,
}: {
  locale: string;
  key: string;
  pathname: string; // e.g. "/courses" or "" for the home page
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `metadata.${key}` });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${pathname}`,
      languages: {
        en: `/en${pathname}`,
        ar: `/ar${pathname}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}${pathname}`,
      locale: locale === "ar" ? "ar_AE" : "en_US",
    },
  };
}
