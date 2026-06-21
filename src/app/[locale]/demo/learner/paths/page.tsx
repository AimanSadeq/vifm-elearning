import { DemoShell } from "@/components/demo/DemoShell";

const paths = [
  { title: "Certified Financial Analyst (CFA-like)", description: "6-course sequence covering valuation, risk, portfolio theory, and financial reporting", courses: 6, completed: 2, hours: 72, badge: "🎓", color: "from-blue-500 to-indigo-600" },
  { title: "Banking Compliance Professional", description: "Complete compliance training: AML, KYC, Basel III, sanctions screening, regulatory reporting", courses: 5, completed: 3, hours: 58, badge: "🏛️", color: "from-emerald-500 to-teal-600" },
  { title: "Finance Data Analytics Track", description: "Excel, Power BI, Python for Finance, and financial modeling for the data-driven finance professional", courses: 4, completed: 1, hours: 40, badge: "📊", color: "from-violet-500 to-purple-600" },
];

export default async function LearnerPathsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="learner" locale={locale} activePath="/paths">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">Structured career tracks with guided course sequences</p>
      </div>
      <div className="space-y-4">
        {paths.map((p, i) => {
          const pct = Math.round((p.completed / p.courses) * 100);
          return (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <div className={`bg-gradient-to-r ${p.color} p-5 text-white`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.badge}</span>
                  <div className="flex-1"><h3 className="text-lg font-bold">{p.title}</h3><p className="text-sm text-white/80">{p.description}</p></div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3 grid grid-cols-3 gap-4 text-center text-sm">
                  <div><div className="text-xl font-bold">{p.courses}</div><div className="text-xs text-muted-foreground">Courses</div></div>
                  <div><div className="text-xl font-bold">{p.hours}h</div><div className="text-xs text-muted-foreground">Content</div></div>
                  <div><div className="text-xl font-bold">{p.completed}/{p.courses}</div><div className="text-xs text-muted-foreground">Completed</div></div>
                </div>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${pct}%` }} /></div>
                <div className="flex gap-2"><button className="flex-1 rounded-md bg-brand-600 py-2 text-sm font-semibold text-white">Continue Path</button><button className="rounded-md border px-4 py-2 text-sm font-semibold">View Courses</button></div>
              </div>
            </div>
          );
        })}
      </div>
    </DemoShell>
  );
}
