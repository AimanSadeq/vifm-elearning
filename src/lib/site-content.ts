/**
 * Shared, semi-static site content that's referenced in multiple places
 * (header nav, marketing pages, footer, etc.). Kept here to avoid
 * duplication and drift. When any of this eventually moves to a
 * `site_settings` DB table, swap the import targets only.
 */

import {
  Award,
  Briefcase,
  Crown,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export interface Office {
  key: string;
  city: string;
  cityAr: string;
  address: string;
  addressAr: string;
  phone: string;
  email: string;
}

export const OFFICES: Office[] = [
  {
    key: "dubai",
    city: "Dubai, UAE",
    cityAr: "دبي، الإمارات",
    address: "DIFC, Gate Village Building 3",
    addressAr: "مركز دبي المالي العالمي، مبنى بوابة القرية ٣",
    phone: "+971 4 123 4567",
    email: "dubai@vifm.academy",
  },
  {
    key: "riyadh",
    city: "Riyadh, KSA",
    cityAr: "الرياض، المملكة العربية السعودية",
    address: "King Fahd Road, Olaya District",
    addressAr: "طريق الملك فهد، حي العليا",
    phone: "+966 11 234 5678",
    email: "riyadh@vifm.academy",
  },
  {
    key: "virginia",
    city: "Virginia, USA",
    cityAr: "فيرجينيا، الولايات المتحدة",
    address: "Tysons Corner Center",
    addressAr: "مركز تايسونز كورنر",
    phone: "+1 703 555 0123",
    email: "info@vifm.academy",
  },
];

export const SUPPORT_EMAIL = "membership@viftraining.com";

export interface DesignationTier {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for hero/card backgrounds */
  gradient: string;
  /** Solid accent color for small icons/chips in nav/header */
  accentColor: string;
  /** Tailwind classes for inline badge on cards */
  badgeColor: string;
}

export const DESIGNATION_TIERS: DesignationTier[] = [
  {
    id: "gateway",
    label: "Gateway Tier",
    labelAr: "المستوى التأسيسي",
    description:
      "Begin your professional certification journey with foundational programs.",
    descriptionAr:
      "ابدأ رحلتك في الشهادات المهنية مع البرامج التأسيسية.",
    icon: GraduationCap,
    gradient:
      "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    accentColor: "#10b981",
    badgeColor:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  {
    id: "professional",
    label: "Professional Tier",
    labelAr: "المستوى المهني",
    description:
      "Advance your career with specialized AI and business certifications.",
    descriptionAr:
      "طوّر مسيرتك المهنية مع شهادات متخصصة في الذكاء الاصطناعي والأعمال.",
    icon: Briefcase,
    gradient:
      "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    accentColor: "#3b82f6",
    badgeColor:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    id: "executive",
    label: "Executive Tier",
    labelAr: "المستوى التنفيذي",
    description:
      "Lead with strategic expertise through our most advanced programs.",
    descriptionAr:
      "قُد بخبرة استراتيجية من خلال برامجنا الأكثر تقدمًا.",
    icon: Crown,
    gradient:
      "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    accentColor: "#f59e0b",
    badgeColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
];

export const DESIGNATION_TIER_IDS = DESIGNATION_TIERS.map((t) => t.id);

export function getDesignationTier(id: string | null | undefined) {
  if (!id) return null;
  return DESIGNATION_TIERS.find((t) => t.id === id) ?? null;
}

/** Intentionally re-exported so consumers need only one import. */
export { Award };
