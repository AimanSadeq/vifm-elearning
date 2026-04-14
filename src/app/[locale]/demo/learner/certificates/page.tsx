import { DemoShell } from "@/components/demo/DemoShell";

const certificates = [
  { title: "Excel for Finance Professionals", issued: "Mar 15, 2026", valid: "Mar 15, 2027", id: "VIFM-2026-EFP-4821", grade: "A" },
  { title: "Banking Fundamentals", issued: "Jan 22, 2026", valid: "Jan 22, 2027", id: "VIFM-2026-BF-3104", grade: "A+" },
];

export default async function LearnerCertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="learner" locale={locale} activePath="/certificates">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">2 earned · valid for 1 year · shareable on LinkedIn</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((c, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 to-yellow-100">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-5 text-white">
              <div className="mb-2 text-4xl">🏆</div>
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="text-sm text-white/85">Professional Certificate</p>
            </div>
            <div className="p-5">
              <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-muted-foreground">Grade</div><div className="font-bold">{c.grade}</div></div>
                <div><div className="text-muted-foreground">Issued</div><div className="font-bold">{c.issued}</div></div>
                <div><div className="text-muted-foreground">Valid Until</div><div className="font-bold">{c.valid}</div></div>
                <div><div className="text-muted-foreground">Certificate ID</div><code className="text-[10px] font-bold">{c.id}</code></div>
              </div>
              <div className="flex gap-2"><button className="flex-1 rounded-md bg-amber-600 py-2 text-sm font-semibold text-white">Download PDF</button><button className="rounded-md border px-3 py-2 text-sm font-semibold">Share</button></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border-2 border-dashed border-muted-foreground/30 p-8 text-center">
        <div className="mb-2 text-4xl">🎓</div>
        <h3 className="mb-1 font-semibold">Earn your next certificate</h3>
        <p className="mb-4 text-sm text-muted-foreground">Complete &ldquo;Financial Analysis Masterclass&rdquo; (78% done) to earn your 3rd certificate.</p>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Continue Learning</button>
      </div>
    </DemoShell>
  );
}
