import { DemoShell } from "@/components/demo/DemoShell";

const orgs = [
  { name: "Al Rajhi Bank", domain: "alrajhi.sa", seats: 500, used: 412, plan: "Enterprise", country: "🇸🇦 KSA" },
  { name: "Emirates NBD", domain: "emirates-nbd.ae", seats: 350, used: 298, plan: "Enterprise", country: "🇦🇪 UAE" },
  { name: "First Abu Dhabi Bank", domain: "fab.ae", seats: 250, used: 187, plan: "Enterprise", country: "🇦🇪 UAE" },
  { name: "Samba Bank", domain: "sambabank.sa", seats: 200, used: 152, plan: "Business", country: "🇸🇦 KSA" },
  { name: "QNB", domain: "qnb.qa", seats: 400, used: 203, plan: "Enterprise", country: "🇶🇦 Qatar" },
  { name: "Kuwait Finance House", domain: "kfh.com.kw", seats: 150, used: 89, plan: "Business", country: "🇰🇼 Kuwait" },
];

export default async function AdminOrgsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/organizations">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">{orgs.length} corporate accounts · 1,850 total seats · 1,341 active learners</p>
        </div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ Add Organization</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((o, i) => {
          const pct = Math.round((o.used / o.seats) * 100);
          return (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div><div className="font-semibold">{o.name}</div><div className="text-xs text-muted-foreground">{o.domain}</div></div>
                <span className="text-xs">{o.country}</span>
              </div>
              <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">Seat usage</span><span className="font-semibold">{o.used} / {o.seats}</span></div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
              <div className="flex items-center justify-between text-xs"><span className="rounded bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{o.plan}</span><button className="font-semibold text-brand-600 hover:underline">Manage →</button></div>
            </div>
          );
        })}
      </div>
    </DemoShell>
  );
}
