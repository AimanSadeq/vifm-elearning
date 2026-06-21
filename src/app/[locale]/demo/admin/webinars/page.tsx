import { DemoShell } from "@/components/demo/DemoShell";

const webinars = [
  { title: "IFRS 17 Implementation Deep Dive", date: "Apr 22, 2026 · 2:00 PM GST", host: "Dr. Sarah Ahmed", registered: 147, capacity: 200, status: "upcoming" },
  { title: "Basel IV: What Banks Need to Know", date: "Apr 29, 2026 · 4:00 PM GST", host: "Prof. Omar Hassan", registered: 89, capacity: 150, status: "upcoming" },
  { title: "AI in Compliance Monitoring", date: "May 5, 2026 · 3:00 PM GST", host: "Dr. Khaled Al-Mutairi", registered: 34, capacity: 100, status: "upcoming" },
  { title: "Q1 Regulatory Updates GCC", date: "Apr 1, 2026 · 2:00 PM GST", host: "Dr. Sarah Ahmed", registered: 198, capacity: 200, status: "past" },
  { title: "ESG Reporting for Banks", date: "Mar 18, 2026 · 3:00 PM GST", host: "Maria Fernandez", registered: 156, capacity: 200, status: "past" },
];

export default async function AdminWebinarsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/webinars">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="mb-1 text-3xl font-bold">Webinars</h1><p className="text-muted-foreground">3 upcoming · 2 past · 624 total registrations</p></div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">+ Schedule Webinar</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {webinars.map((w, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${w.status === "upcoming" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{w.status}</span>
              <button className="text-xs text-muted-foreground hover:text-foreground">⋯</button>
            </div>
            <h3 className="mb-1 font-semibold">{w.title}</h3>
            <p className="mb-3 text-xs text-muted-foreground">📅 {w.date}</p>
            <p className="mb-3 text-sm">Hosted by <span className="font-medium">{w.host}</span></p>
            <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Registration</span><span className="font-semibold">{w.registered} / {w.capacity}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(w.registered / w.capacity) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
