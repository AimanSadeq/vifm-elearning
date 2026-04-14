import { DemoShell } from "@/components/demo/DemoShell";

const transactions = [
  { id: "TXN-92841", user: "Al Rajhi Bank", course: "Enterprise Renewal (500 seats)", amount: "$149,950", method: "Invoice", date: "Apr 8, 2026", status: "paid" },
  { id: "TXN-92840", user: "Ahmed Al-Rashid", course: "Financial Analysis Masterclass", amount: "$299", method: "Visa ••4821", date: "Apr 8, 2026", status: "paid" },
  { id: "TXN-92839", user: "Emirates NBD", course: "Q2 Enrollment Package", amount: "$89,500", method: "Wire Transfer", date: "Apr 7, 2026", status: "paid" },
  { id: "TXN-92838", user: "Sarah Johnson", course: "Risk Management & Basel III", amount: "$399", method: "Mastercard ••7104", date: "Apr 7, 2026", status: "paid" },
  { id: "TXN-92837", user: "Fatima Al-Shehri", course: "Anti-Money Laundering", amount: "$249", method: "Visa ••3392", date: "Apr 6, 2026", status: "refunded" },
  { id: "TXN-92836", user: "QNB", course: "Enterprise Upgrade", amount: "$62,400", method: "Invoice", date: "Apr 5, 2026", status: "pending" },
];

export default async function AdminPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/payments">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Transactions · Invoices · Subscriptions · Promo Codes</p>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">This month</div><div className="mt-1 text-2xl font-bold text-emerald-600">$302,397</div><div className="text-xs text-emerald-600">+18.4% vs last month</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Pending</div><div className="mt-1 text-2xl font-bold text-amber-600">$62,400</div><div className="text-xs text-muted-foreground">1 invoice awaiting</div></div>
        <div className="rounded-xl border bg-card p-5"><div className="text-xs text-muted-foreground">Refunded</div><div className="mt-1 text-2xl font-bold text-rose-600">$249</div><div className="text-xs text-muted-foreground">1 transaction</div></div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4"><h2 className="text-sm font-semibold">Recent Transactions</h2><button className="rounded-md border px-3 py-1 text-xs font-semibold">Export</button></div>
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground"><tr><th className="p-3">Transaction</th><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Date</th><th className="p-3">Status</th></tr></thead>
          <tbody className="divide-y text-sm">
            {transactions.map((t, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="p-3"><code className="text-xs">{t.id}</code><div className="text-xs text-muted-foreground">{t.course}</div></td>
                <td className="p-3">{t.user}</td>
                <td className="p-3 font-semibold">{t.amount}</td>
                <td className="p-3 text-xs text-muted-foreground">{t.method}</td>
                <td className="p-3 text-xs text-muted-foreground">{t.date}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${t.status === "paid" ? "bg-emerald-100 text-emerald-700" : t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
