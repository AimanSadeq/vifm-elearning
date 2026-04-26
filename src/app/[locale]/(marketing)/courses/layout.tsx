import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "كل الدورات" : "All Courses";
  const description = isAr
    ? "تصفح كتالوج VIFM الكامل من الدورات الاحترافية في المالية، البيانات، الإستراتيجية والامتثال."
    : "Browse VIFM's complete catalog of professional courses in Finance, Data Analytics, Strategy and Compliance.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/courses`,
      languages: { en: "/en/courses", ar: "/ar/courses" },
    },
    openGraph: { title, description, url: `/${locale}/courses` },
  };
}

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
