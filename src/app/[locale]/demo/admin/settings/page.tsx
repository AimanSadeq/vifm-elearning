import { DemoShell } from "@/components/demo/DemoShell";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/settings">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Platform configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Platform</h2>
          <div className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium">Platform Name</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="VIFM Academy" /></div>
            <div><label className="mb-1 block text-sm font-medium">Support Email</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="support@viftraining.com" /></div>
            <div><label className="mb-1 block text-sm font-medium">Default Language</label><select className="w-full rounded-md border px-3 py-2 text-sm"><option>English</option><option>العربية</option></select></div>
            <div><label className="mb-1 block text-sm font-medium">Time Zone</label><select className="w-full rounded-md border px-3 py-2 text-sm"><option>Asia/Riyadh (GMT+3)</option><option>Asia/Dubai (GMT+4)</option></select></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Features</h3>
            {[{ name: "Webinars", on: true }, { name: "Forums", on: true }, { name: "Corporate Portals", on: true }, { name: "Public Testimonials", on: false }, { name: "AI Course Recommendations", on: true }].map((f) => (
              <div key={f.name} className="mb-2 flex items-center justify-between">
                <span className="text-sm">{f.name}</span>
                <div className={`h-5 w-9 rounded-full p-0.5 ${f.on ? "bg-emerald-500" : "bg-slate-300"}`}><div className={`h-4 w-4 rounded-full bg-white transition-transform ${f.on ? "translate-x-4" : ""}`} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-2 text-sm font-semibold">Integrations</h3>
            <p className="text-xs text-muted-foreground">Supabase · Cloudflare Stream · SendGrid · Stripe</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end"><button className="rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white">Save Changes</button></div>
    </DemoShell>
  );
}
