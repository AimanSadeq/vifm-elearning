import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → redirect to login
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Not super_admin → redirect to learner dashboard
  if (user.app_metadata?.role !== "super_admin") {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <>
      <AdminHeader dashboardHref={`/${locale}/admin/dashboard`} />
      <DashboardLayout role="super_admin">{children}</DashboardLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}
