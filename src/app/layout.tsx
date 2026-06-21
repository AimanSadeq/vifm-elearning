import type { Metadata } from "next";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import { APP_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "VIFM Academy Professional Training & E-Learning",
    template: "%s | VIFM Academy",
  },
  description:
    "Virginia Institute of Finance and Management Professional training and e-learning courses in Finance, Data Analytics, Strategy, and Compliance across the GCC region.",
  applicationName: "VIFM Academy",
  authors: [{ name: "VIFM Academy" }],
  keywords: [
    "VIFM",
    "professional training",
    "e-learning",
    "finance courses",
    "GCC training",
    "UAE certifications",
    "data analytics",
    "compliance training",
  ],
  openGraph: {
    type: "website",
    siteName: "VIFM Academy",
    title: "VIFM Academy Professional Training & E-Learning",
    description:
      "Professional training in Finance, Data Analytics, Strategy and Compliance across the GCC region.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIFM Academy",
    description:
      "Professional training in Finance, Data Analytics, Strategy and Compliance across the GCC region.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script src="/demo-data.js" strategy="beforeInteractive" />
        <Script src="/demo-mode.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
