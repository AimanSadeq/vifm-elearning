"use client";

import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/types";

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
