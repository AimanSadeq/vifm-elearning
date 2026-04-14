import { DemoShell } from "@/components/demo/DemoShell";

const courses = [
  { title: "Financial Analysis Masterclass", category: "Finance", instructor: "Dr. Sarah Ahmed", students: 324, rating: 4.7, status: "published", price: "$299" },
  { title: "Risk Management & Basel III", category: "Finance", instructor: "Prof. Omar Hassan", students: 198, rating: 4.8, status: "published", price: "$399" },
  { title: "Excel for Finance Professionals", category: "Data Analytics", instructor: "Maria Fernandez", students: 289, rating: 4.5, status: "published", price: "Free" },
  { title: "Anti-Money Laundering (AML)", category: "Compliance", instructor: "Dr. Sarah Ahmed", students: 256, rating: 4.6, status: "published", price: "$249" },
  { title: "Leadership in Banking", category: "Leadership", instructor: "Prof. Omar Hassan", students: 142, rating: 4.9, status: "published", price: "$449" },
  { title: "Advanced DCF Valuation", category: "Finance", instructor: "Dr. Sarah Ahmed", students: 0, rating: 0, status: "draft", price: "$349" },
  { title: "Islamic Finance Fundamentals", category: "Finance", instructor: "Dr. Khaled Al-Mutairi", students: 87, rating: 4.8, status: "published", price: "$279" },
];

export default async function AdminCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/courses">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">{courses.length} total · 6 published · 1 draft</p>
        </div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ New Course</button>
      </div>
      <div className="mb-4 flex gap-2">
        <input type="search" placeholder="Search courses…" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <select className="rounded-md border px-3 py-2 text-sm"><option>All Categories</option><option>Finance</option><option>Data Analytics</option><option>Compliance</option><option>Leadership</option></select>
        <select className="rounded-md border px-3 py-2 text-sm"><option>All Status</option><option>Published</option><option>Draft</option></select>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr><th className="p-3">Course</th><th className="p-3">Instructor</th><th className="p-3">Students</th><th className="p-3">Rating</th><th className="p-3">Price</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y text-sm">
            {courses.map((c, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="p-3"><div className="font-medium">{c.title}</div><div className="text-xs text-muted-foreground">{c.category}</div></td>
                <td className="p-3 text-muted-foreground">{c.instructor}</td>
                <td className="p-3">{c.students}</td>
                <td className="p-3">{c.rating > 0 ? `⭐ ${c.rating}` : "—"}</td>
                <td className="p-3 font-semibold">{c.price}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoShell>
  );
}
