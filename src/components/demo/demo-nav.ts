export type DemoRole = "admin" | "instructor" | "learner";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const DEMO_NAV: Record<DemoRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "", icon: "📊" },
    { label: "Courses", href: "/courses", icon: "📚" },
    { label: "Users", href: "/users", icon: "👥" },
    { label: "Organizations", href: "/organizations", icon: "🏢" },
    { label: "Payments", href: "/payments", icon: "💳" },
    { label: "Certificates", href: "/certificates", icon: "🏆" },
    { label: "Analytics", href: "/analytics", icon: "📈" },
    { label: "Webinars", href: "/webinars", icon: "🎥" },
    { label: "Testimonials", href: "/testimonials", icon: "💬" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ],
  instructor: [
    { label: "Dashboard", href: "", icon: "📊" },
    { label: "My Courses", href: "/courses", icon: "📚" },
    { label: "Forums", href: "/forums", icon: "💬" },
    { label: "Analytics", href: "/analytics", icon: "📈" },
  ],
  learner: [
    { label: "Dashboard", href: "", icon: "🏠" },
    { label: "My Courses", href: "/courses", icon: "📚" },
    { label: "Learning Paths", href: "/paths", icon: "🗺️" },
    { label: "Certificates", href: "/certificates", icon: "🏆" },
    { label: "Subscription", href: "/subscription", icon: "💳" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ],
};
