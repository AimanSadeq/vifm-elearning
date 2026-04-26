import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr ? "تواصل معنا" : "Contact Us";
  const description = isAr
    ? "تواصل مع فريق أكاديمية VIFM للاستفسار عن الدورات أو التدريب المؤسسي أو الدعم الفني."
    : "Get in touch with the VIFM Academy team for course enquiries, corporate training, or technical support.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { en: "/en/contact", ar: "/ar/contact" },
    },
    openGraph: { title, description, url: `/${locale}/contact` },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
