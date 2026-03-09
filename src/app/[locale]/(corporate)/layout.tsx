import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function CorporateLayout({
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

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!["super_admin", "corporate_admin"].includes(user.app_metadata?.role)) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <>
      <Header />
      <DashboardLayout role="corporate_admin">{children}</DashboardLayout>
    </>
  );
}
