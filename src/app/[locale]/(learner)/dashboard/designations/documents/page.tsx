"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { FileText, Download, Lock, ArrowLeft, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface DesignationDocument {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  download_count: number;
  sort_order: number;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<DesignationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase
        .from("designation_documents")
        .select("id, title, title_ar, description, description_ar, file_url, file_type, file_size_bytes, download_count, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setDocuments((data ?? []) as DesignationDocument[]);
      setIsLoading(false);
    }

    if (!authLoading) fetchDocuments();
  }, [user, authLoading]);

  async function handleDownload(doc: DesignationDocument) {
    setDownloading(doc.id);

    try {
      const supabase = createClient();

      // Get signed URL
      const { data, error } = await supabase.storage
        .from("designation-documents")
        .createSignedUrl(doc.file_url.replace("designation-documents/", ""), 60);

      if (error || !data?.signedUrl) throw new Error("Failed to generate download link");

      // Increment download count via API
      await fetch("/api/designations/documents/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });

      // Trigger download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = `${doc.title}.${doc.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(null);
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/dashboard/designations`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold">
          {locale === "ar" ? "مكتبة الوثائق" : "Documents Library"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {locale === "ar"
            ? "وثائق DIBoK ومواد مرجعية حصرية لحاملي CDIP النشطين."
            : "DIBoK documents and reference materials exclusive to active CDIP holders."}
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              {locale === "ar" ? "لا توجد وثائق متاحة" : "No documents available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc, index) => {
            const title = locale === "ar" && doc.title_ar ? doc.title_ar : doc.title;
            const desc = locale === "ar" && doc.description_ar ? doc.description_ar : doc.description;
            const isDownloading = downloading === doc.id;

            return (
              <Card key={doc.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <BookOpen className="h-6 w-6 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{title}</p>
                      {desc && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{desc}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {doc.file_type}
                        </span>
                        {doc.file_size_bytes && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatFileSize(doc.file_size_bytes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      className="shrink-0"
                    >
                      {isDownloading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
