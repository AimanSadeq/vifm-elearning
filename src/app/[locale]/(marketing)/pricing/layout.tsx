import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "الأسعار والاشتراكات" : "Pricing & Subscriptions";
  const description = isAr
    ? "اختر خطة الاشتراك المناسبة للوصول إلى كل دورات VIFM وندواتها وشهاداتها."
    : "Pick a subscription plan for unlimited access to VIFM's courses, webinars and certifications.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: { en: "/en/pricing", ar: "/ar/pricing" },
    },
    openGraph: { title, description, url: `/${locale}/pricing` },
  };
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
