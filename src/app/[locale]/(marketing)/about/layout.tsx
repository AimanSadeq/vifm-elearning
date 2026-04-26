import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "عن أكاديمية VIFM" : "About VIFM Academy";
  const description = isAr
    ? "تعرف على معهد فيرجينيا للمالية والإدارة، رسالتنا، فريقنا ومكاتبنا في الإمارات والسعودية."
    : "Learn about the Virginia Institute of Finance and Management — our mission, faculty, and offices across the GCC.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { en: "/en/about", ar: "/ar/about" },
    },
    openGraph: { title, description, url: `/${locale}/about` },
  };
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
