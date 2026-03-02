import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/lib/utils/constants";
import { HeroBackground } from "@/components/landing/HeroBackground";
import { HeroContent } from "@/components/landing/HeroContent";
import { StatsBar } from "@/components/landing/StatsBar";
import { CategoriesGrid } from "@/components/landing/CategoriesGrid";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { SocialProof } from "@/components/landing/SocialProof";
import { CTASection } from "@/components/landing/CTASection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const features = [
    {
      iconName: "graduation-cap",
      title: t("expertInstructors"),
      description: t("expertInstructorsDesc"),
    },
    {
      iconName: "clock",
      title: t("flexibleLearning"),
      description: t("flexibleLearningDesc"),
    },
    {
      iconName: "award",
      title: t("certifiedPrograms"),
      description: t("certifiedProgramsDesc"),
    },
    {
      iconName: "building2",
      title: t("corporateTraining"),
      description: t("corporateTrainingDesc"),
    },
  ];

  const categories = CATEGORIES.map((cat) => ({
    iconName: cat.icon,
    name: locale === "ar" ? cat.nameAr : cat.name,
    color: cat.color,
    slug: cat.slug,
  }));

  const stats = [
    { value: 500, suffix: "+", label: t("statProfessionals") },
    { value: 50, suffix: "+", label: t("statCourses") },
    { value: 95, suffix: "%", label: t("statSatisfaction") },
    { value: 20, suffix: "+", label: t("statPartners") },
  ];

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white min-h-[90vh] flex flex-col justify-center">
          <HeroBackground />
          <div className="container relative z-10 mx-auto px-4 pt-16 pb-8 lg:pt-24 lg:pb-12">
            <HeroContent
              title={t("heroTitle")}
              subtitle={t("heroSubtitle")}
              exploreCTA={t("exploreCourses")}
              getStartedCTA={t("getStarted")}
              exploreHref={`/${locale}/courses`}
              getStartedHref={`/${locale}/register`}
              badgeText={t("heroBadge")}
            />
          </div>
          <div className="container relative z-10 mx-auto px-4 pb-16">
            <StatsBar stats={stats} />
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <CategoriesGrid
              categories={categories}
              locale={locale}
              title={tc("categories")}
            />
          </div>
        </section>

        {/* Features - Bento Grid */}
        <section className="bg-secondary/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <BentoFeatures features={features} sectionTitle={t("whyVifm")} sectionSubtitle={t("ourAdvantages")} />
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof sectionTitle={t("trustedBy")} stats={stats} sectionSubtitle={t("socialProofLabel")} recognizedBy={t("recognizedBy")} />

        {/* CTA */}
        <CTASection
          title={t("readyToStart")}
          subtitle={t("joinLearners")}
          ctaText={t("getStarted")}
          ctaHref={`/${locale}/register`}
        />
      </main>
      <Footer />
    </>
  );
}
