import { Header } from "@/components/layout/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardLayout role="instructor">{children}</DashboardLayout>
    </>
  );
}
