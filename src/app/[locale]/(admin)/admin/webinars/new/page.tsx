"use client";

import { WebinarForm } from "@/components/admin/WebinarForm";

export default function NewWebinarPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Create New Webinar</h1>
      <WebinarForm mode="create" />
    </div>
  );
}
