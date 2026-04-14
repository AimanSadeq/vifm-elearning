import { DemoShell } from "@/components/demo/DemoShell";

export default async function AdminAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const revenue = [180, 210, 245, 268, 287, 302];
  const enrollments = [1420, 1680, 1850, 2010, 2180, 2380];

  return (
    <DemoShell role="admin" locale={locale} activePath="/analytics">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform performance over the last 6 months</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Revenue (YTD)</div><div className="mt-1 text-2xl font-bold">$1.49M</div><div className="text-xs text-emerald-600">↑ 34.2%</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Avg. Completion Rate</div><div className="mt-1 text-2xl font-bold">76.3%</div><div className="text-xs text-emerald-600">↑ 3.1%</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">NPS Score</div><div className="mt-1 text-2xl font-bold">68</div><div className="text-xs text-emerald-600">↑ 4 pts</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Avg. Session Length</div><div className="mt-1 text-2xl font-bold">28 min</div><div className="text-xs text-muted-foreground">↔ stable</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Revenue by Month ($K)</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {revenue.map((r, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400" style={{ height: `${(r / 320) * 100}%` }} />
                <div className="text-xs text-muted-foreground">{months[i]}</div>
                <div className="text-[10px] font-semibold">${r}K</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">Monthly Enrollments</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {enrollments.map((e, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400" style={{ height: `${(e / 2500) * 100}%` }} />
                <div className="text-xs text-muted-foreground">{months[i]}</div>
                <div className="text-[10px] font-semibold">{e.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <h3 className="mb-4 font-semibold">Top Performing Categories</h3>
        <div className="space-y-3">
          {[{ cat: "Finance", pct: 42, amt: "$624K" }, { cat: "Compliance", pct: 28, amt: "$418K" }, { cat: "Data Analytics", pct: 18, amt: "$268K" }, { cat: "Leadership", pct: 12, amt: "$179K" }].map((c) => (
            <div key={c.cat}>
              <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{c.cat}</span><span className="text-muted-foreground">{c.amt} ({c.pct}%)</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-600" style={{ width: `${c.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
}
