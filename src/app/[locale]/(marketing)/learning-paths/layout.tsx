import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    key: "learningPaths",
    pathname: "/learning-paths",
  });
}

export default function LearningPathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
