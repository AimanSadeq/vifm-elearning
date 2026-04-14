import Link from "next/link";

export default async function DemoHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const roles = [
    { slug: "admin", label: "Admin Demo", sub: "Full platform view", icon: "🔐", color: "from-rose-500 to-red-600" },
    { slug: "instructor", label: "Instructor Demo", sub: "Course management", icon: "👨‍🏫", color: "from-violet-500 to-purple-600" },
    { slug: "learner", label: "Learner Demo", sub: "Personal learning journey", icon: "👤", color: "from-sky-500 to-blue-600" },
  ];
  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold">Choose a demo experience</h1>
        <p className="text-muted-foreground">Pick a role to preview the VIFM Academy platform with sample data.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {roles.map((r) => (
          <Link
            key={r.slug}
            href={`/${locale}/demo/${r.slug}`}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${r.color} p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className="mb-4 text-5xl">{r.icon}</div>
            <h2 className="mb-1 text-xl font-bold">{r.label}</h2>
            <p className="text-sm text-white/80">{r.sub}</p>
            <span className="mt-6 inline-block rounded-md bg-white/20 px-3 py-1 text-xs font-semibold">
              Launch demo →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
