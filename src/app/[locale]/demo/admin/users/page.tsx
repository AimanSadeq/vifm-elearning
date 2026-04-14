import { DemoShell } from "@/components/demo/DemoShell";

const users = [
  { name: "Ahmed Al-Rashid", email: "a.rashid@bank.sa", role: "Learner", org: "Al Rajhi Bank", status: "active", joined: "Mar 2, 2026" },
  { name: "Sarah Johnson", email: "s.johnson@emirates-nbd.ae", role: "Learner", org: "Emirates NBD", status: "active", joined: "Feb 14, 2026" },
  { name: "Dr. Sarah Ahmed", email: "sahmed@vifm.org", role: "Instructor", org: "VIFM", status: "active", joined: "Jan 10, 2025" },
  { name: "Mohammed Al-Qassim", email: "m.qassim@alrajhi.sa", role: "Learner", org: "Al Rajhi Bank", status: "active", joined: "Feb 28, 2026" },
  { name: "Fatima Al-Shehri", email: "f.shehri@sambabank.sa", role: "Learner", org: "Samba Bank", status: "active", joined: "Mar 10, 2026" },
  { name: "John Patel", email: "j.patel@fab.ae", role: "Corporate Admin", org: "First Abu Dhabi Bank", status: "active", joined: "Jan 5, 2026" },
  { name: "Prof. Omar Hassan", email: "ohassan@vifm.org", role: "Instructor", org: "VIFM", status: "active", joined: "Sep 1, 2024" },
  { name: "Layla Al-Fahim", email: "l.fahim@qnb.qa", role: "Learner", org: "QNB", status: "inactive", joined: "Dec 20, 2025" },
];

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/users">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">{users.length} users · 7 active · 1 inactive</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-4 py-2 text-sm font-semibold">Export CSV</button>
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ Invite User</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Organization</th><th className="p-3">Status</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody className="divide-y text-sm">
            {users.map((u, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="p-3"><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                <td className="p-3"><span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{u.role}</span></td>
                <td className="p-3 text-muted-foreground">{u.org}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{u.status}</span></td>
                <td className="p-3 text-xs text-muted-foreground">{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
