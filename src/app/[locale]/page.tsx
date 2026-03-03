import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/lib/utils/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import { HeroBackground } from "@/components/landing/HeroBackground";
import { HeroContent } from "@/components/landing/HeroContent";
import { StatsBar } from "@/components/landing/StatsBar";
import { CategoriesGrid } from "@/components/landing/CategoriesGrid";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { SocialProof } from "@/components/landing/SocialProof";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FeaturedCoursesSection } from "@/components/landing/FeaturedCoursesSection";
import { CertificationProgramsSection } from "@/components/landing/CertificationProgramsSection";
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

  // Fetch active testimonials
  const supabase = await createServerSupabase();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Fetch active designations
  const { data: designations } = await supabase
    .from("designations")
    .select(
      "id, name, name_ar, slug, abbreviation, description, description_ar, founding_fee, currency, annual_cpe_required, metadata"
    )
    .eq("is_active", true)
    .order("name");

  // Fetch featured courses
  const { data: featuredCourses } = await supabase
    .from("courses")
    .select(`
      *,
      category:categories(id, name, name_ar, slug, color),
      instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(9);

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white min-h-[90vh] flex flex-col justify-center">
          <HeroBackground />
          {/* Stats ticker at top */}
          <div className="container relative z-10 mx-auto px-4 pt-16 lg:pt-24 flex justify-center">
            <StatsBar stats={stats} />
          </div>
          <div className="container relative z-10 mx-auto px-4 pt-8 pb-16 lg:pt-12 lg:pb-24">
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

        {/* Featured Courses */}
        {featuredCourses && featuredCourses.length > 0 && (
          <FeaturedCoursesSection
            courses={featuredCourses}
            locale={locale}
            sectionTitle={t("featuredCoursesTitle")}
            sectionSubtitle={t("featuredCoursesSubtitle")}
            viewAllText={t("viewAllCourses")}
            viewAllHref={`/${locale}/courses`}
          />
        )}

        {/* Features - Bento Grid */}
        <section className="bg-secondary/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <BentoFeatures features={features} sectionTitle={t("whyVifm")} sectionSubtitle={t("ourAdvantages")} />
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof sectionTitle={t("trustedBy")} stats={stats} sectionSubtitle={t("socialProofLabel")} recognizedBy={t("recognizedBy")} />

        {/* Certification Programs */}
        {designations && designations.length > 0 && (
          <CertificationProgramsSection
            designations={designations}
            locale={locale}
            sectionTitle={t("certificationProgramsTitle")}
            sectionSubtitle={t("certificationProgramsSubtitle")}
            viewAllText={t("viewAllCertifications")}
            viewAllHref={`/${locale}/designations`}
          />
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <TestimonialsCarousel testimonials={testimonials} locale={locale} />
        )}

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
