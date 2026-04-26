import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "المسارات التعليمية" : "Learning Paths";
  const description = isAr
    ? "تتبع مسارات منسقة من الدورات تقودك من المبتدئ إلى المحترف في كل تخصص."
    : "Curated, sequential course paths that take you from beginner to expert in each specialty.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/learning-paths`,
      languages: { en: "/en/learning-paths", ar: "/ar/learning-paths" },
    },
    openGraph: { title, description, url: `/${locale}/learning-paths` },
  };
}

export default function LearningPathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
