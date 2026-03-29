import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "VIFM Academy - Professional Training & E-Learning",
    template: "%s | VIFM Academy",
  },
  description:
    "Virginia Institute of Finance and Management — Professional training and e-learning courses in Finance, Data Analytics, Strategy, and Compliance across the GCC region.",
};

// Root layout must include <html> and <body> for Next.js.
// The [locale] layout will override lang/dir attributes via next-intl.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script src="/demo-data.js" strategy="beforeInteractive" />
        <Script src="/demo-mode.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
