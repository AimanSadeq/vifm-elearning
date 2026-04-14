import { DemoShell } from "@/components/demo/DemoShell";

const courses = [
  { title: "Financial Analysis Masterclass", students: 324, rating: 4.7, completion: 78, lessons: 16, status: "published" },
  { title: "Risk Management & Basel III", students: 198, rating: 4.8, completion: 65, lessons: 20, status: "published" },
  { title: "Excel for Finance Professionals", students: 289, rating: 4.5, completion: 82, lessons: 12, status: "published" },
  { title: "Anti-Money Laundering (AML)", students: 256, rating: 4.6, completion: 71, lessons: 15, status: "published" },
  { title: "Advanced DCF Valuation", students: 0, rating: 0, completion: 0, lessons: 18, status: "draft" },
];

export default async function InstructorCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="instructor" locale={locale} activePath="/courses">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="mb-1 text-3xl font-bold">My Courses</h1><p className="text-muted-foreground">5 courses · 1,067 total students</p></div>
        <button className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white">+ New Course</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="flex-1 font-semibold">{c.title}</h3>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3 text-center text-xs">
              <div><div className="text-lg font-bold">{c.students}</div><div className="text-muted-foreground">Students</div></div>
              <div><div className="text-lg font-bold">{c.lessons}</div><div className="text-muted-foreground">Lessons</div></div>
              <div><div className="text-lg font-bold">{c.rating > 0 ? c.rating : "—"}</div><div className="text-muted-foreground">Rating</div></div>
            </div>
            {c.status === "published" && (<><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Avg. completion</span><span className="font-semibold">{c.completion}%</span></div><div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${c.completion}%` }} /></div></>)}
            <div className="flex gap-2"><button className="flex-1 rounded-md bg-violet-600 py-1.5 text-xs font-semibold text-white">Edit</button><button className="flex-1 rounded-md border py-1.5 text-xs font-semibold">Analytics</button></div>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
