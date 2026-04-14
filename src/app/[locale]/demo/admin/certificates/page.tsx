import { DemoShell } from "@/components/demo/DemoShell";

const certs = [
  { id: "VIFM-2026-FAM-8421", user: "Ahmed Al-Rashid", course: "Financial Analysis Masterclass", issued: "Apr 10, 2026", valid: "Apr 10, 2027" },
  { id: "VIFM-2026-AML-7890", user: "Sarah Johnson", course: "Anti-Money Laundering", issued: "Apr 7, 2026", valid: "Apr 7, 2027" },
  { id: "VIFM-2026-EFP-4821", user: "Fatima Al-Shehri", course: "Excel for Finance Professionals", issued: "Apr 5, 2026", valid: "Apr 5, 2027" },
  { id: "VIFM-2026-RMB-3104", user: "John Patel", course: "Risk Management & Basel III", issued: "Apr 1, 2026", valid: "Apr 1, 2027" },
  { id: "VIFM-2026-LIB-2095", user: "Mohammed Al-Qassim", course: "Leadership in Banking", issued: "Mar 28, 2026", valid: "Mar 28, 2027" },
];

export default async function AdminCertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/certificates">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="mb-1 text-3xl font-bold">Certificates</h1><p className="text-muted-foreground">1,847 issued this year · 2 templates configured</p></div>
        <div className="flex gap-2"><button className="rounded-md border px-4 py-2 text-sm font-semibold">Manage Templates</button><button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">+ Issue Certificate</button></div>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Total Issued</div><div className="mt-1 text-2xl font-bold">1,847</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">This Month</div><div className="mt-1 text-2xl font-bold text-emerald-600">152</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Expiring in 30 days</div><div className="mt-1 text-2xl font-bold text-amber-600">28</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Revoked</div><div className="mt-1 text-2xl font-bold text-rose-600">3</div></div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground"><tr><th className="p-3">Certificate ID</th><th className="p-3">Learner</th><th className="p-3">Course</th><th className="p-3">Issued</th><th className="p-3">Valid Until</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y text-sm">
            {certs.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="p-3"><code className="text-xs">{c.id}</code></td>
                <td className="p-3">{c.user}</td>
                <td className="p-3 text-muted-foreground">{c.course}</td>
                <td className="p-3 text-xs">{c.issued}</td>
                <td className="p-3 text-xs">{c.valid}</td>
                <td className="p-3"><button className="text-xs font-semibold text-brand-600 hover:underline">Download PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
