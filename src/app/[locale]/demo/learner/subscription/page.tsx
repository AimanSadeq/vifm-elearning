import { DemoShell } from "@/components/demo/DemoShell";

export default async function LearnerSubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="learner" locale={locale} activePath="/subscription">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Your VIFM Academy plan</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
        <div className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">Professional Plan</span>
            <span className="rounded bg-emerald-400 px-2 py-0.5 text-xs font-bold text-emerald-900">ACTIVE</span>
          </div>
          <div className="mb-3 text-3xl font-bold">$29 <span className="text-lg font-normal text-white/80">/ month</span></div>
          <p className="text-sm text-white/90">Unlimited access to all courses, certifications, and webinars</p>
        </div>
        <div className="border-t border-white/20 bg-white/10 p-5 text-sm">
          <div className="flex justify-between"><span>Next billing date</span><span className="font-semibold">May 14, 2026</span></div>
          <div className="mt-1 flex justify-between"><span>Payment method</span><span className="font-semibold">Visa ••4821</span></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: "Starter", price: "Free", features: ["3 free courses", "Community access", "Basic certificates"], current: false },
          { name: "Professional", price: "$29/mo", features: ["All courses", "All certifications", "Webinar access", "Priority support"], current: true },
          { name: "Enterprise", price: "Contact us", features: ["Team dashboards", "SSO", "Custom learning paths", "Dedicated CSM"], current: false },
        ].map((p) => (
          <div key={p.name} className={`rounded-xl border p-5 ${p.current ? "border-brand-600 bg-brand-50/50" : "bg-card"}`}>
            <h3 className="mb-1 font-semibold">{p.name}</h3>
            <div className="mb-3 text-2xl font-bold">{p.price}</div>
            <ul className="mb-4 space-y-1 text-sm">
              {p.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-emerald-600">✓</span>{f}</li>)}
            </ul>
            <button disabled={p.current} className={`w-full rounded-md py-2 text-sm font-semibold ${p.current ? "bg-muted text-muted-foreground" : "bg-brand-600 text-white"}`}>{p.current ? "Current Plan" : "Upgrade"}</button>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
