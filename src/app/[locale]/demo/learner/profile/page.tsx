import { DemoShell } from "@/components/demo/DemoShell";

export default async function LearnerProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <DemoShell role="learner" locale={locale} activePath="/profile">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium">Full Name</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="Demo Learner" /></div>
              <div><label className="mb-1 block text-sm font-medium">Email</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="demo@vifm.org" /></div>
              <div><label className="mb-1 block text-sm font-medium">Phone</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="+966 5X XXX XXXX" /></div>
              <div><label className="mb-1 block text-sm font-medium">Job Title</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="Financial Analyst" /></div>
              <div><label className="mb-1 block text-sm font-medium">Organization</label><input className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="VIFM Academy Demo" /></div>
              <div><label className="mb-1 block text-sm font-medium">Country</label><select className="w-full rounded-md border px-3 py-2 text-sm"><option>🇸🇦 Saudi Arabia</option><option>🇦🇪 United Arab Emirates</option><option>🇶🇦 Qatar</option><option>🇰🇼 Kuwait</option></select></div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div><div className="text-sm font-medium">Email notifications</div><div className="text-xs text-muted-foreground">Course updates, new lessons, announcements</div></div><div className="h-5 w-9 rounded-full bg-emerald-500 p-0.5"><div className="h-4 w-4 translate-x-4 rounded-full bg-white" /></div></div>
              <div className="flex items-center justify-between"><div><div className="text-sm font-medium">Weekly progress report</div><div className="text-xs text-muted-foreground">Summary email every Monday</div></div><div className="h-5 w-9 rounded-full bg-emerald-500 p-0.5"><div className="h-4 w-4 translate-x-4 rounded-full bg-white" /></div></div>
              <div className="flex items-center justify-between"><div><div className="text-sm font-medium">Marketing emails</div><div className="text-xs text-muted-foreground">Webinar invites, new course announcements</div></div><div className="h-5 w-9 rounded-full bg-slate-300 p-0.5"><div className="h-4 w-4 rounded-full bg-white" /></div></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-3xl font-bold text-white">D</div>
            <div className="font-semibold">Demo Learner</div>
            <div className="mb-4 text-xs text-muted-foreground">Member since Jan 2026</div>
            <button className="rounded-md border px-3 py-1 text-xs font-semibold">Change Photo</button>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Learning Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Courses enrolled</span><span className="font-semibold">4</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-semibold">1</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Certificates</span><span className="font-semibold">2</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hours learned</span><span className="font-semibold">38.5</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end"><button className="rounded-md bg-brand-600 px-6 py-2 text-sm font-semibold text-white">Save Changes</button></div>
    </DemoShell>
  );
}
