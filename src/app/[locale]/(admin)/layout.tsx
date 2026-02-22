import { Header } from "@/components/layout/Header";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardLayout role="super_admin">{children}</DashboardLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}
