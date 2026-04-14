import { DemoShell } from "@/components/demo/DemoShell";

const threads = [
  { title: "WACC calculation clarification - Module 3", course: "Financial Analysis", author: "Ahmed Al-Rashid", replies: 4, lastReply: "12 min ago", unanswered: false },
  { title: "Difference between VaR and CVaR?", course: "Risk Management", author: "Sarah Johnson", replies: 0, lastReply: "1 hour ago", unanswered: true },
  { title: "Best XLOOKUP formula for nested lookups", course: "Excel for Finance", author: "Fatima Al-Shehri", replies: 2, lastReply: "3 hours ago", unanswered: false },
  { title: "KYC requirements for correspondent banks", course: "AML", author: "Mohammed Al-Qassim", replies: 0, lastReply: "5 hours ago", unanswered: true },
  { title: "Excel financial modeling template request", course: "Excel for Finance", author: "John Patel", replies: 8, lastReply: "1 day ago", unanswered: false },
  { title: "Basel III liquidity ratios - practical example?", course: "Risk Management", author: "Layla Al-Fahim", replies: 3, lastReply: "2 days ago", unanswered: false },
];

export default async function InstructorForumsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="instructor" locale={locale} activePath="/forums">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Forums</h1>
        <p className="text-muted-foreground">{threads.filter(t => t.unanswered).length} unanswered questions require your attention</p>
      </div>
      <div className="mb-4 flex gap-2">
        <input type="search" placeholder="Search threads…" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <select className="rounded-md border px-3 py-2 text-sm"><option>All Courses</option><option>Financial Analysis</option><option>Risk Management</option><option>Excel for Finance</option><option>AML</option></select>
        <select className="rounded-md border px-3 py-2 text-sm"><option>All</option><option>Unanswered</option><option>My Replies</option></select>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="divide-y">
          {threads.map((t, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-4 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2"><h3 className="font-medium">{t.title}</h3>{t.unanswered && <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">UNANSWERED</span>}</div>
                <div className="text-xs text-muted-foreground">{t.course} · by <span className="font-medium">{t.author}</span> · {t.lastReply}</div>
              </div>
              <div className="text-right"><div className="text-sm font-semibold">{t.replies}</div><div className="text-xs text-muted-foreground">replies</div></div>
            </div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
}
