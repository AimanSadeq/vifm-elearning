import { DemoShell } from "@/components/demo/DemoShell";

export default async function InstructorAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const enrollments = [24, 38, 42, 51, 48, 62, 71, 58];

  return (
    <DemoShell role="instructor" locale={locale} activePath="/analytics">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Course Analytics</h1>
        <p className="text-muted-foreground">Performance across your 5 courses</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Total Students</div><div className="mt-1 text-2xl font-bold">1,067</div><div className="text-xs text-emerald-600">+124 this month</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Avg. Rating</div><div className="mt-1 text-2xl font-bold">4.7 ⭐</div><div className="text-xs text-emerald-600">+0.1</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Avg. Completion</div><div className="mt-1 text-2xl font-bold">74%</div><div className="text-xs text-emerald-600">+3%</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Q&A Response Time</div><div className="mt-1 text-2xl font-bold">4.2h</div><div className="text-xs text-emerald-600">Excellent</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">New Enrollments (8 weeks)</h3>
          <div className="flex h-48 items-end justify-between gap-2">
            {enrollments.map((e, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-purple-400" style={{ height: `${(e / 80) * 100}%` }} />
                <div className="text-xs text-muted-foreground">{weeks[i]}</div>
                <div className="text-[10px] font-semibold">{e}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Course Performance</h3>
          <div className="space-y-3">
            {[{ title: "Financial Analysis", rating: 4.7, students: 324 }, { title: "Risk Management", rating: 4.8, students: 198 }, { title: "Excel for Finance", rating: 4.5, students: 289 }, { title: "AML", rating: 4.6, students: 256 }].map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                <div><div className="text-sm font-medium">{c.title}</div><div className="text-xs text-muted-foreground">{c.students} students</div></div>
                <div className="text-right"><div className="text-sm font-semibold">⭐ {c.rating}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
