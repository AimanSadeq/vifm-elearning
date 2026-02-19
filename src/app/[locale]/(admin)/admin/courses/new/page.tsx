"use client";

import { useTranslations } from "next-intl";
import { CourseForm } from "@/components/admin/CourseForm";

export default function CreateCoursePage() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t("createCourse")}</h1>
      <CourseForm mode="create" />
    </div>
  );
}
