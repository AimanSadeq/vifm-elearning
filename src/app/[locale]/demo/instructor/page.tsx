import { DemoShell } from "@/components/demo/DemoShell";
import { BookOpen, Users, Star, MessageSquare, Clock } from "lucide-react";

const stats = [
  { label: "My Courses", value: "5", icon: BookOpen, color: "text-violet-600 bg-violet-100" },
  { label: "Active Students", value: "1,284", icon: Users, color: "text-blue-600 bg-blue-100" },
  { label: "Average Rating", value: "4.7 ⭐", icon: Star, color: "text-amber-600 bg-amber-100" },
  { label: "Pending Questions", value: "12", icon: MessageSquare, color: "text-rose-600 bg-rose-100" },
];

const myCourses = [
  { title: "Financial Analysis Masterclass", students: 324, rating: 4.7, completion: 78, status: "published" },
  { title: "Risk Management & Basel III", students: 198, rating: 4.8, completion: 65, status: "published" },
  { title: "Excel for Finance Professionals", students: 289, rating: 4.5, completion: 82, status: "published" },
  { title: "Anti-Money Laundering (AML)", students: 256, rating: 4.6, completion: 71, status: "published" },
  { title: "Advanced DCF Valuation", students: 0, rating: 0, completion: 0, status: "draft" },
];

const recentQuestions = [
  { student: "Ahmed Al-Rashid", course: "Financial Analysis", time: "12 min ago", question: "Clarification on WACC calculation in module 3" },
  { student: "Sarah Johnson", course: "Risk Management", time: "1 hour ago", question: "Can you explain the difference between VaR and CVaR?" },
  { student: "Fatima Al-Shehri", course: "Excel for Finance", time: "3 hours ago", question: "Which XLOOKUP formula works best for nested lookups?" },
];

export default async function InstructorDemoDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="instructor" locale={locale} activePath="">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and track student engagement</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-violet-600" /> My Courses</h2>
            <button className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">+ New Course</button>
          </div>
          <div className="divide-y">
            {myCourses.map((c, i) => (
              <div key={i} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.students} students · {c.rating > 0 ? `⭐ ${c.rating}` : "No ratings yet"}</div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span>
                </div>
                {c.status === "published" && (
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Avg. completion</span><span>{c.completion}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600" style={{ width: `${c.completion}%` }} /></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5 text-rose-600" /> Recent Questions</h2>
          </div>
          <div className="divide-y">
            {recentQuestions.map((q, i) => (
              <div key={i} className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-medium">{q.student}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{q.time}</div>
                </div>
                <div className="mb-2 text-xs text-muted-foreground">{q.course}</div>
                <div className="text-sm text-foreground/80">{q.question}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
