import Image from "next/image";
import { DemoShell } from "@/components/demo/DemoShell";
import { PlayCircle } from "lucide-react";

const courses = [
  { title: "Financial Analysis Masterclass", instructor: "Dr. Sarah Ahmed", progress: 78, lessonsDone: 12, totalLessons: 16, image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80", nextLesson: "Module 4 — DCF Valuation Practice" },
  { title: "Risk Management & Basel III", instructor: "Prof. Omar Hassan", progress: 45, lessonsDone: 9, totalLessons: 20, image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80", nextLesson: "Chapter 5 — Market Risk Framework" },
  { title: "Excel for Finance Professionals", instructor: "Maria Fernandez", progress: 100, lessonsDone: 12, totalLessons: 12, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", nextLesson: "Completed" },
  { title: "Anti-Money Laundering (AML)", instructor: "Dr. Sarah Ahmed", progress: 23, lessonsDone: 4, totalLessons: 15, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80", nextLesson: "Module 2 — Transaction Monitoring" },
];

export default async function LearnerCoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="learner" locale={locale} activePath="/courses">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">4 enrolled · 1 completed · 3 in progress</p>
      </div>
      <div className="mb-4 flex gap-2">
        <button className="rounded-md border bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">All (4)</button>
        <button className="rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground">In Progress (3)</button>
        <button className="rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground">Completed (1)</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex gap-4 p-4">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={c.image} alt={c.title} fill sizes="128px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 truncate font-semibold">{c.title}</h3>
                <p className="mb-2 text-xs text-muted-foreground">By {c.instructor}</p>
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{c.lessonsDone} / {c.totalLessons} lessons</span><span className="font-semibold">{c.progress}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${c.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${c.progress}%` }} /></div>
              </div>
            </div>
            <div className="border-t bg-muted/30 p-3 text-xs">
              <div className="mb-2 text-muted-foreground">Next: <span className="font-medium text-foreground">{c.nextLesson}</span></div>
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-sm font-semibold text-white"><PlayCircle className="h-4 w-4" />{c.progress === 100 ? "Review" : "Continue"}</button>
            </div>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
