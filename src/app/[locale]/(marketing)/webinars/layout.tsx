import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "ندوات عبر الإنترنت" : "Webinars";
  const description = isAr
    ? "ندوات حية ومسجلة من خبراء الصناعة في المالية والأعمال والامتثال."
    : "Live and on-demand webinars from industry experts in Finance, Business and Compliance.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/webinars`,
      languages: { en: "/en/webinars", ar: "/ar/webinars" },
    },
    openGraph: { title, description, url: `/${locale}/webinars` },
  };
}

export default function WebinarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
