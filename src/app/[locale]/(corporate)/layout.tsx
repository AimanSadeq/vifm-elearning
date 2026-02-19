import { Header } from "@/components/layout/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardLayout role="corporate_admin">{children}</DashboardLayout>
    </>
  );
}
