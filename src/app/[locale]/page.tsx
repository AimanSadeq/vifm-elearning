import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/lib/utils/constants";
import {
  GraduationCap,
  Clock,
  Award,
  Building2,
  Landmark,
  BrainCircuit,
  Target,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const CATEGORY_ICONS = {
  landmark: Landmark,
  "brain-circuit": BrainCircuit,
  target: Target,
  "shield-check": ShieldCheck,
} as const;

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
      icon: GraduationCap,
      title: t("expertInstructors"),
      description: t("expertInstructorsDesc"),
    },
    {
      icon: Clock,
      title: t("flexibleLearning"),
      description: t("flexibleLearningDesc"),
    },
    {
      icon: Award,
      title: t("certifiedPrograms"),
      description: t("certifiedProgramsDesc"),
    },
    {
      icon: Building2,
      title: t("corporateTraining"),
      description: t("corporateTrainingDesc"),
    },
  ];

  const categories = CATEGORIES.map((cat) => ({
    icon: CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS],
    name: locale === "ar" ? cat.nameAr : cat.name,
    color: cat.color,
    slug: cat.slug,
  }));

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 text-lg text-brand-200 lg:text-xl">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50 transition-colors"
                >
                  {t("exploreCourses")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  {t("getStarted")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl font-bold text-center">
              {tc("categories")}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-4 rounded-card border p-6 text-center shadow-card hover:shadow-card-hover transition-all"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <cat.icon
                      className="h-7 w-7"
                      style={{ color: cat.color }}
                    />
                  </div>
                  <h3 className="font-heading text-lg font-semibold group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary/50 py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl font-bold text-center">
              {t("whyVifm")}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                    <feature.icon className="h-7 w-7 text-brand-600" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-400 py-16 lg:py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading text-3xl font-bold">
              {t("readyToStart")}
            </h2>
            <p className="mt-4 text-lg text-white/80">{t("joinLearners")}</p>
            <div className="mt-8">
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-950 hover:bg-brand-50 transition-colors"
              >
                {t("getStarted")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
