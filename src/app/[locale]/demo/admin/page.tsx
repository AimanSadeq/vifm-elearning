import { DollarSign, Users, BookOpen, TrendingUp, GraduationCap, FileCheck } from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "$284,520", trend: "+12.4%", icon: DollarSign, color: "text-emerald-600 bg-emerald-100" },
  { label: "Active Users", value: "8,412", trend: "+5.8%", icon: Users, color: "text-blue-600 bg-blue-100" },
  { label: "Total Enrollments", value: "23,108", trend: "+18.2%", icon: BookOpen, color: "text-violet-600 bg-violet-100" },
  { label: "Completion Rate", value: "76.3%", trend: "+3.1%", icon: TrendingUp, color: "text-amber-600 bg-amber-100" },
];

const recentEnrollments = [
  { name: "Ahmed Al-Rashid", email: "a.rashid@bank.sa", course: "Financial Analysis Masterclass", date: "2 hours ago", status: "active" },
  { name: "Sarah Johnson", email: "s.johnson@emirates-nbd.ae", course: "Risk Management & Basel III", date: "5 hours ago", status: "active" },
  { name: "Mohammed Al-Qassim", email: "m.qassim@alrajhi.sa", course: "Anti-Money Laundering", date: "1 day ago", status: "completed" },
  { name: "Fatima Al-Shehri", email: "f.shehri@sambabank.sa", course: "Excel for Finance", date: "1 day ago", status: "active" },
  { name: "John Patel", email: "j.patel@fab.ae", course: "Leadership in Banking", date: "2 days ago", status: "active" },
];

const topCourses = [
  { title: "Financial Analysis Masterclass", enrollments: 324, rating: 4.7, revenue: "$96,876" },
  { title: "Excel for Finance Professionals", enrollments: 289, rating: 4.5, revenue: "Free" },
  { title: "Anti-Money Laundering (AML)", enrollments: 256, rating: 4.6, revenue: "$63,744" },
  { title: "Risk Management & Basel III", enrollments: 198, rating: 4.8, revenue: "$79,002" },
  { title: "Leadership in Banking", enrollments: 142, rating: 4.9, revenue: "$63,758" },
];

export default function AdminDemoPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview and analytics</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className={`rounded-lg p-2 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-emerald-600">{s.trend}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="h-5 w-5 text-violet-600" />
              Recent Enrollments
            </h2>
          </div>
          <div className="divide-y">
            {recentEnrollments.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.course}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-muted-foreground">{e.date}</div>
                  <span className={`inline-block rounded px-2 py-0.5 font-medium ${e.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileCheck className="h-5 w-5 text-amber-600" />
              Top Courses
            </h2>
          </div>
          <div className="divide-y">
            {topCourses.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.enrollments} enrolled · ⭐ {c.rating}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold">{c.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
