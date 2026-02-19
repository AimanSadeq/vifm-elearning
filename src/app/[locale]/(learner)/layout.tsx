import { Header } from "@/components/layout/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardLayout role="learner">{children}</DashboardLayout>
    </>
  );
}
