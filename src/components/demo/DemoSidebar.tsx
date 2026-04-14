import Link from "next/link";
import { DEMO_NAV, type DemoRole } from "./demo-nav";

export function DemoSidebar({ role, locale, activePath }: { role: DemoRole; locale: string; activePath: string }) {
  const items = DEMO_NAV[role];
  const rolePath = `/demo/${role}`;

  return (
    <aside className="sticky top-[100px] hidden h-fit w-60 shrink-0 md:block">
      <nav className="flex flex-col gap-1 rounded-xl border bg-card p-3">
        {items.map((item) => {
          const href = `/${locale}${rolePath}${item.href}`;
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href || "root"}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
