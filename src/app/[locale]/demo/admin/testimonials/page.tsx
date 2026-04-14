import { DemoShell } from "@/components/demo/DemoShell";

const testimonials = [
  { author: "Ahmed Al-Rashid", role: "Senior Analyst, Al Rajhi Bank", quote: "The Financial Analysis Masterclass gave me practical skills I apply every day. Worth every penny.", rating: 5, status: "published" },
  { author: "Sarah Johnson", role: "Risk Manager, Emirates NBD", quote: "Basel III course was exactly what I needed to pass my certification. Clear, structured, and current.", rating: 5, status: "published" },
  { author: "Fatima Al-Shehri", role: "Finance Officer, Samba Bank", quote: "Excel for Finance transformed my productivity. Now I build models in half the time.", rating: 4, status: "published" },
  { author: "John Patel", role: "Regional Head, FAB", quote: "VIFM has become our go-to for continuous professional development across 187 employees.", rating: 5, status: "pending" },
  { author: "Layla Al-Fahim", role: "Compliance Officer, QNB", quote: "The AML course is thorough without being dry. Great case studies from GCC markets.", rating: 5, status: "published" },
];

export default async function AdminTestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="admin" locale={locale} activePath="/testimonials">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="mb-1 text-3xl font-bold">Testimonials</h1><p className="text-muted-foreground">4 published · 1 pending review · avg rating 4.8 ⭐</p></div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">+ Request Testimonial</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-amber-500">{"⭐".repeat(t.rating)}</div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${t.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{t.status}</span>
            </div>
            <blockquote className="mb-3 text-sm italic">&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="border-t pt-3">
              <div className="font-semibold">{t.author}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}
