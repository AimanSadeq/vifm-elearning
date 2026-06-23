import {
  Landmark,
  Banknote,
  LineChart,
  BrainCircuit,
  Target,
  Building2,
  ClipboardList,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

// Map each category to a clean lucide line icon (instead of the DB emoji) so
// the web matches the mobile app's icon style. Resolved by keyword from the
// slug + name, so new categories still get a sensible icon (default BookOpen).
/** True for the "All Courses" catch-all category (no real category page). */
export function isAllCoursesCategory(
  slug?: string | null,
  name?: string | null,
): boolean {
  const s = `${slug ?? ""} ${name ?? ""}`.toLowerCase();
  return s.includes("all course") || s.includes("all-course");
}

export function iconForCategory(slug: string, name: string): LucideIcon {
  const s = `${slug} ${name}`.toLowerCase();
  if (s.includes("all course") || s.includes("all-course")) return BookOpen;
  if (s.includes("finance")) return Landmark;
  if (s.includes("bank")) return Banknote;
  if (s.includes("data") || s.includes("analytic")) return LineChart;
  if (
    s.includes("artificial") ||
    s.includes("intelligence") ||
    s.includes("machine")
  )
    return BrainCircuit;
  if (s.includes("strategy") || s.includes("leadership")) return Target;
  if (
    s.includes("real estate") ||
    s.includes("real-estate") ||
    s.includes("property")
  )
    return Building2;
  if (s.includes("project")) return ClipboardList;
  return BookOpen;
}
