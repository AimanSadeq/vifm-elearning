import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/lib/utils/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import { HeroBackground } from "@/components/landing/HeroBackground";
import { HeroContent } from "@/components/landing/HeroContent";
import { StatsBar } from "@/components/landing/StatsBar";
import { CategoriesGrid } from "@/components/landing/CategoriesGrid";
import { SocialProof } from "@/components/landing/SocialProof";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FeaturedCoursesSection } from "@/components/landing/FeaturedCoursesSection";
import { CertificationProgramsSection } from "@/components/landing/CertificationProgramsSection";
import { CTASection } from "@/components/landing/CTASection";
import { PlatformFeatures } from "@/components/landing/PlatformFeatures";
import { CareerPathways } from "@/components/landing/CareerPathways";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const title = isAr
    ? "أكاديمية VIFM — تدريب احترافي وتعلم إلكتروني"
    : "VIFM Academy — Professional Training & E-Learning";
  const description = isAr
    ? "دورات تدريبية احترافية في المالية، تحليلات البيانات، الإستراتيجية والامتثال عبر دول الخليج العربي."
    : "Professional training in Finance, Data Analytics, Strategy and Compliance across the GCC region.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
    openGraph: {
      title,
      description,
      locale: isAr ? "ar_AE" : "en_US",
      url: `/${locale}`,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const CAT_DESCRIPTIONS: Record<string, string> = {
    "finance-banking": t("catFinanceDesc"),
    "data-analytics-ai": t("catDataDesc"),
    "strategy-leadership": t("catStrategyDesc"),
    "compliance-risk": t("catComplianceDesc"),
  };

  const categories = CATEGORIES.map((cat) => ({
    iconName: cat.icon,
    name: locale === "ar" ? cat.nameAr : cat.name,
    description: CAT_DESCRIPTIONS[cat.slug],
    color: cat.color,
    slug: cat.slug,
  }));

  const stats = [
    { value: 500, suffix: "+", label: t("statProfessionals") },
    { value: 50, suffix: "+", label: t("statCourses") },
    { value: 95, suffix: "%", label: t("statSatisfaction") },
    { value: 20, suffix: "+", label: t("statPartners") },
    { value: 10, suffix: "+", label: t("statCountries") },
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
    .select("*")
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
              title={t("categoriesTitle")}
              subtitle={t("categoriesSubtitle")}
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

        {/* Platform Features — Immersive Learning Showcase */}
        <PlatformFeatures
          sectionTitle={t("platformFeaturesTitle")}
          sectionSubtitle={t("platformFeaturesSubtitle")}
          features={[
            { id: "bilingual", title: t("pfBilingualTitle"), description: t("pfBilingualDesc"), highlights: [t("pfBilingualH1"), t("pfBilingualH2"), t("pfBilingualH3")] },
            { id: "videoLearning", title: t("pfVideoTitle"), description: t("pfVideoDesc"), highlights: [t("pfVideoH1"), t("pfVideoH2"), t("pfVideoH3")] },
            { id: "quizzes", title: t("pfQuizzesTitle"), description: t("pfQuizzesDesc"), highlights: [t("pfQuizzesH1"), t("pfQuizzesH2"), t("pfQuizzesH3")] },
            { id: "cpeTracking", title: t("pfCpeTitle"), description: t("pfCpeDesc"), highlights: [t("pfCpeH1"), t("pfCpeH2"), t("pfCpeH3")] },
            { id: "certificates", title: t("pfCertificatesTitle"), description: t("pfCertificatesDesc"), highlights: [t("pfCertificatesH1"), t("pfCertificatesH2"), t("pfCertificatesH3")] },
            { id: "assessments", title: t("pfAssessmentsTitle"), description: t("pfAssessmentsDesc"), highlights: [t("pfAssessmentsH1"), t("pfAssessmentsH2"), t("pfAssessmentsH3")] },
          ]}
        />

        {/* Social Proof */}
        <SocialProof sectionTitle={t("trustedBy")} stats={stats} sectionSubtitle={t("socialProofLabel")} />

        {/* Career Pathways */}
        <CareerPathways
          sectionTitle={t("careerPathwaysTitle")}
          sectionSubtitle={t("careerPathwaysSubtitle")}
          ctaText={t("careerCTA")}
          ctaHref={`/${locale}/designations`}
          tiers={[
            {
              id: "gateway",
              title: t("careerGatewayTitle"),
              description: t("careerGatewayDesc"),
              highlights: [t("careerGatewayH1"), t("careerGatewayH2"), t("careerGatewayH3")],
              designationLabel: t("careerDesignations", { count: designations?.filter((d) => d.metadata?.tier_level === "gateway").length ?? 0 }),
            },
            {
              id: "professional",
              title: t("careerProfessionalTitle"),
              description: t("careerProfessionalDesc"),
              highlights: [t("careerProfessionalH1"), t("careerProfessionalH2"), t("careerProfessionalH3")],
              designationLabel: t("careerDesignations", { count: designations?.filter((d) => d.metadata?.tier_level === "professional").length ?? 0 }),
            },
            {
              id: "executive",
              title: t("careerExecutiveTitle"),
              description: t("careerExecutiveDesc"),
              highlights: [t("careerExecutiveH1"), t("careerExecutiveH2"), t("careerExecutiveH3")],
              designationLabel: t("careerDesignations", { count: designations?.filter((d) => d.metadata?.tier_level === "executive").length ?? 0 }),
            },
          ]}
        />

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
