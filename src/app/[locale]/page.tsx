import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  HOME_SECTION_SETTING_KEYS,
  resolveHomeSections,
} from "@/lib/home-sections";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
import { SectionMarker } from "@/components/landing/SectionMarker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { pageMetadata } = await import("@/lib/seo/page-metadata");
  return pageMetadata({ locale, key: "home", pathname: "" });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const stats = [
    { value: 500, suffix: "+", label: t("statProfessionals") },
    { value: 50, suffix: "+", label: t("statCourses") },
    { value: 95, suffix: "%", label: t("statSatisfaction") },
    { value: 20, suffix: "+", label: t("statPartners") },
    { value: 10, suffix: "+", label: t("statCountries") },
  ];

  // Fetch active testimonials
  const supabase = await createServerSupabase();

  // If the visitor is already signed in, the "Get Started" CTAs should
  // shortcut into the dashboard instead of bouncing them to /register —
  // showing the registration form to a logged-in user is a dead end.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const getStartedHref = user
    ? `/${locale}/dashboard`
    : `/${locale}/register`;

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Fetch active categories from the DB so admin edits flow straight to the
  // landing page. Falls back to an empty list, in which case the categories
  // section is suppressed below.
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("id, name, name_ar, slug, description, description_ar, icon, color")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Only show categories that have at least one published course (the
  // "All Courses" catch-all is always kept).
  const { data: publishedCatRows } = await supabase
    .from("courses")
    .select("category_id")
    .eq("status", "published");
  const categoriesWithCourses = new Set(
    (publishedCatRows ?? [])
      .map((r) => r.category_id)
      .filter((id): id is string => Boolean(id))
  );
  const isAllCoursesCat = (slug?: string | null, name?: string | null) => {
    const s = `${slug ?? ""} ${name ?? ""}`.toLowerCase();
    return s.includes("all course") || s.includes("all-course");
  };

  const categories = (dbCategories ?? [])
    .filter(
      (cat) =>
        categoriesWithCourses.has(cat.id) || isAllCoursesCat(cat.slug, cat.name)
    )
    .map((cat) => ({
    iconName: cat.icon ?? "",
    name:
      locale === "ar"
        ? (cat.name_ar?.trim() ? cat.name_ar : cat.name)
        : cat.name,
    description:
      locale === "ar"
        ? (cat.description_ar?.trim() ? cat.description_ar : cat.description) ?? undefined
        : cat.description ?? undefined,
    color: cat.color ?? "#1E3A5F",
    slug: cat.slug,
  }));

  // Fetch active designations
  const { data: designations } = await supabase
    .from("designations")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch featured courses — gate by locale so an Arabic-only course doesn't
  // leak onto the EN homepage and vice versa.
  let featuredQ = supabase
    .from("courses")
    .select(`
      *,
      category:categories(id, name, name_ar, slug, color),
      instructor:profiles!courses_instructor_id_fkey(full_name, full_name_ar, avatar_url)
    `)
    .eq("status", "published")
    .eq("is_featured", true);

  if (locale === "ar") {
    featuredQ = featuredQ
      .not("title_ar", "is", null)
      .neq("title_ar", "")
      .filter("title_ar", "match", "[؀-ۿ]");
  } else {
    featuredQ = featuredQ
      .not("title", "is", null)
      .neq("title", "")
      .filter("title", "match", "[A-Za-z]");
  }

  const { data: featuredCourses } = await featuredQ
    .order("created_at", { ascending: false })
    .limit(9);

  // Admin-toggleable home section visibility.
  const { data: sectionRows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", HOME_SECTION_SETTING_KEYS);
  const sections = resolveHomeSections(sectionRows ?? []);

  return (
    <>
      <Header />
      <main>
        {/* Hero — solid brand-950 lets the animated orbs in HeroBackground
            do the gradient work without muddying with a static 3-stop. */}
        <section className="relative overflow-hidden bg-brand-950 text-white min-h-[88vh] flex flex-col justify-center">
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
              getStartedHref={getStartedHref}
              badgeText={t("heroBadge")}
            />
          </div>
        </section>

        {/* Categories Section */}
        {sections.categories && categories.length > 0 && (
          <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <SectionMarker
                index="01"
                eyebrow={t("categoriesSubtitle")}
                title={t("categoriesTitle")}
                align="center"
              />
              <CategoriesGrid
                categories={categories}
                locale={locale}
                title=""
                subtitle=""
              />
            </div>
          </section>
        )}

        {/* Featured Courses — marker rendered as a standalone div above the
            section, since FeaturedCoursesSection brings its own <section>
            wrapper with vertical padding. */}
        {sections.featured_courses && featuredCourses && featuredCourses.length > 0 && (
          <>
            <div className="container mx-auto px-4 pt-16 lg:pt-20">
              <SectionMarker
                index="02"
                eyebrow={t("featuredCoursesSubtitle")}
                title={t("featuredCoursesTitle")}
                align="center"
              />
            </div>
            <FeaturedCoursesSection
              courses={featuredCourses}
              locale={locale}
              sectionTitle=""
              sectionSubtitle=""
              viewAllText={t("viewAllCourses")}
              viewAllHref={`/${locale}/courses`}
            />
          </>
        )}

        {/* Platform Features — Immersive Learning Showcase */}
        {sections.platform_features && (
          <>
        <div className="container mx-auto px-4 pt-16 lg:pt-20">
          <SectionMarker
            index="03"
            eyebrow={t("platformFeaturesSubtitle")}
            title={t("platformFeaturesTitle")}
            align="center"
          />
        </div>
        <PlatformFeatures
          sectionTitle=""
          sectionSubtitle=""
          features={[
            { id: "bilingual", title: t("pfBilingualTitle"), description: t("pfBilingualDesc"), highlights: [t("pfBilingualH1"), t("pfBilingualH2"), t("pfBilingualH3")] },
            { id: "videoLearning", title: t("pfVideoTitle"), description: t("pfVideoDesc"), highlights: [t("pfVideoH1"), t("pfVideoH2"), t("pfVideoH3")] },
            { id: "quizzes", title: t("pfQuizzesTitle"), description: t("pfQuizzesDesc"), highlights: [t("pfQuizzesH1"), t("pfQuizzesH2"), t("pfQuizzesH3")] },
            { id: "cpeTracking", title: t("pfCpeTitle"), description: t("pfCpeDesc"), highlights: [t("pfCpeH1"), t("pfCpeH2"), t("pfCpeH3")] },
            { id: "certificates", title: t("pfCertificatesTitle"), description: t("pfCertificatesDesc"), highlights: [t("pfCertificatesH1"), t("pfCertificatesH2"), t("pfCertificatesH3")] },
            { id: "assessments", title: t("pfAssessmentsTitle"), description: t("pfAssessmentsDesc"), highlights: [t("pfAssessmentsH1"), t("pfAssessmentsH2"), t("pfAssessmentsH3")] },
          ]}
        />
          </>
        )}

        {/* Social Proof */}
        {sections.social_proof && (
          <SocialProof sectionTitle={t("trustedBy")} stats={stats} sectionSubtitle={t("socialProofLabel")} />
        )}

        {/* Career Pathways — dark section, marker rendered inside the
            component on its own brand-950 canvas to keep contrast clean. */}
        {sections.career_pathways && (
        <CareerPathways
          markerIndex="04"
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
        )}

        {/* Certification Programs */}
        {sections.certifications && designations && designations.length > 0 && (
          <>
            <div className="container mx-auto px-4 pt-16 lg:pt-20">
              <SectionMarker
                index="05"
                eyebrow={t("certificationProgramsSubtitle")}
                title={t("certificationProgramsTitle")}
                align="center"
              />
            </div>
            <CertificationProgramsSection
              designations={designations}
              locale={locale}
              sectionTitle=""
              sectionSubtitle=""
              viewAllText={t("viewAllCertifications")}
              viewAllHref={`/${locale}/designations`}
            />
          </>
        )}

        {/* Testimonials */}
        {sections.testimonials && testimonials && testimonials.length > 0 && (
          <TestimonialsCarousel testimonials={testimonials} locale={locale} />
        )}

        {/* CTA */}
        {sections.cta && (
        <CTASection
          title={t("readyToStart")}
          subtitle={t("joinLearners")}
          ctaText={t("getStarted")}
          ctaHref={getStartedHref}
          tagline={t("ctaTagline")}
          highlights={[
            {
              icon: "courses",
              value: t("ctaHighlightCoursesValue"),
              label: t("ctaHighlightCoursesLabel"),
            },
            {
              icon: "bilingual",
              value: t("ctaHighlightBilingualValue"),
              label: t("ctaHighlightBilingualLabel"),
            },
            {
              icon: "region",
              value: t("ctaHighlightRegionValue"),
              label: t("ctaHighlightRegionLabel"),
            },
          ]}
        />
        )}
      </main>
      <Footer />
    </>
  );
}
