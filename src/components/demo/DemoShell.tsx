import Link from "next/link";
import { DemoSidebar } from "./DemoSidebar";
import type { DemoRole } from "./demo-nav";

export function DemoShell({
  role,
  locale,
  activePath,
  children,
}: {
  role: DemoRole;
  locale: string;
  activePath: string;
  children: React.ReactNode;
}) {
  const roleLabel = role === "admin" ? "Admin" : role === "instructor" ? "Instructor" : "Learner";
  const roleColor =
    role === "admin" ? "from-rose-500 to-red-600" : role === "instructor" ? "from-violet-500 to-purple-600" : "from-sky-500 to-blue-600";

  return (
    <div className="min-h-screen bg-background">
      {/* Top demo banner */}
      <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <span>👁</span>
            <span className="text-xs font-bold uppercase tracking-wide">Demo Mode</span>
            <span className={`rounded-full bg-gradient-to-r ${roleColor} px-2.5 py-0.5 text-[11px] font-bold`}>{roleLabel} View</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/demo`} className="rounded bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">Switch Role</Link>
            <Link href={`/${locale}/login`} className="rounded bg-white px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-white/90">Exit Demo</Link>
          </div>
        </div>
      </div>

      {/* App header */}
      <header className="sticky top-[36px] z-40 border-b bg-background">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          <Link href={`/${locale}/demo/${role}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 font-bold text-white">V</div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">VIFM Academy</span>
              <span className="text-[10px] text-muted-foreground">{roleLabel} Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button className="rounded p-2 text-muted-foreground hover:bg-muted" title="Notifications">🔔</button>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${roleColor} text-xs font-bold text-white`}>
                {roleLabel.charAt(0)}
              </div>
              <span className="text-sm font-medium">Demo {roleLabel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6">
        <DemoSidebar role={role} locale={locale} activePath={activePath} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
