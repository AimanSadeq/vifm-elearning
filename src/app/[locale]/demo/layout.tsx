import Link from "next/link";

export default async function DemoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-lg">👁</span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold uppercase tracking-wide">Demo Mode</span>
              <span className="text-xs opacity-90">Sample data only — explore without signing in</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/demo`}
              className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              Switch Role
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-white/90"
            >
              Exit Demo
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
