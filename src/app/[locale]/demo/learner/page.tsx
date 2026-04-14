import Image from "next/image";
import { BookOpen, Award, Clock, Target, TrendingUp, PlayCircle } from "lucide-react";

const stats = [
  { label: "Enrolled Courses", value: "4", icon: BookOpen, color: "text-blue-600 bg-blue-100" },
  { label: "Certificates Earned", value: "2", icon: Award, color: "text-amber-600 bg-amber-100" },
  { label: "Hours Learned", value: "38.5", icon: Clock, color: "text-emerald-600 bg-emerald-100" },
  { label: "Current Streak", value: "12 days", icon: TrendingUp, color: "text-rose-600 bg-rose-100" },
];

const enrolledCourses = [
  { title: "Financial Analysis Masterclass", instructor: "Dr. Sarah Ahmed", progress: 78, lessonsDone: 12, totalLessons: 16, image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80" },
  { title: "Risk Management & Basel III", instructor: "Prof. Omar Hassan", progress: 45, lessonsDone: 9, totalLessons: 20, image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80" },
  { title: "Excel for Finance Professionals", instructor: "Maria Fernandez", progress: 100, lessonsDone: 12, totalLessons: 12, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" },
  { title: "Anti-Money Laundering (AML)", instructor: "Dr. Sarah Ahmed", progress: 23, lessonsDone: 4, totalLessons: 15, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80" },
];

const certificates = [
  { title: "Excel for Finance Professionals", issued: "Mar 15, 2026", id: "VIFM-2026-EFP-4821" },
  { title: "Banking Fundamentals", issued: "Jan 22, 2026", id: "VIFM-2026-BF-3104" },
];

export default function LearnerDemoPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold">Welcome back, Demo Learner 👋</h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Target className="h-5 w-5 text-blue-600" />
          Continue Learning
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {enrolledCourses.map((c, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image src={c.image} alt={c.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="mb-1 font-semibold">{c.title}</h3>
                <p className="mb-3 text-xs text-muted-foreground">By {c.instructor}</p>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">{c.lessonsDone} of {c.totalLessons} lessons</span>
                  <span className="font-semibold">{c.progress}%</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${c.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <PlayCircle className="h-4 w-4" />
                  {c.progress === 100 ? "Review Course" : "Continue"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Award className="h-5 w-5 text-amber-600" />
          My Certificates
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert, i) => (
            <div key={i} className="rounded-xl border bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <Award className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{cert.title}</div>
                  <div className="text-xs text-muted-foreground">Issued {cert.issued}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-xs text-muted-foreground">{cert.id}</code>
                <button className="text-xs font-semibold text-amber-700 hover:underline">Download PDF →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
