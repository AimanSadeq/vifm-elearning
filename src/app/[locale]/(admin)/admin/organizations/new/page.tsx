"use client";

import { OrganizationForm } from "@/components/admin/OrganizationForm";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Create Organization</h1>
      <OrganizationForm mode="create" />
    </div>
  );
}
