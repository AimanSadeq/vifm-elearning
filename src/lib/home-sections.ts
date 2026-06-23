// Admin-toggleable home page sections. Each maps to a `site_settings` row
// `home_section_<key>` holding a boolean. Missing row => the default below.
// The home page (server) and the admin settings page both use this list.

export const HOME_SECTIONS = [
  { key: "categories", label: "Browse by Category" },
  { key: "featured_courses", label: "Featured Courses" },
  { key: "platform_features", label: "Platform Features" },
  { key: "social_proof", label: "Social Proof / Stats" },
  { key: "career_pathways", label: "Career Pathways" },
  { key: "certifications", label: "Certification Programs" },
  { key: "testimonials", label: "Testimonials" },
  { key: "cta", label: "Closing Call-to-Action" },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]["key"];

// Defaults when no setting row exists. Certification Programs defaults OFF
// (hidden); everything else defaults ON.
export const HOME_SECTION_DEFAULTS: Record<HomeSectionKey, boolean> = {
  categories: true,
  featured_courses: true,
  platform_features: true,
  social_proof: true,
  career_pathways: true,
  certifications: false,
  testimonials: true,
  cta: true,
};

export const homeSectionSettingKey = (k: HomeSectionKey) =>
  `home_section_${k}` as const;

export const HOME_SECTION_SETTING_KEYS = HOME_SECTIONS.map((s) =>
  homeSectionSettingKey(s.key),
);

/** Resolve section visibility from `site_settings` rows, applying defaults. */
export function resolveHomeSections(
  rows: { key: string; value: unknown }[],
): Record<HomeSectionKey, boolean> {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<HomeSectionKey, boolean>;
  for (const { key } of HOME_SECTIONS) {
    const v = map.get(homeSectionSettingKey(key));
    out[key] = v === undefined ? HOME_SECTION_DEFAULTS[key] : v === true;
  }
  return out;
}
