"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { formatDate } from "@/lib/utils/formatters";
import type { Certificate } from "@/types";

type CertificateRow = Certificate & {
  course?: { title: string };
  user?: { full_name: string };
};

export default function AdminCertificatesPage() {
  const t = useTranslations("admin");

  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchCertificates() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/certificates?${params.toString()}`);
      const { data } = await res.json();
      setCertificates(data ?? []);
      setIsLoading(false);
    }

    fetchCertificates();
  }, [debouncedSearch]);

  const handleToggleStatus = async (cert: CertificateRow) => {
    const newStatus = cert.status === "issued" ? "revoked" : "issued";
    const res = await fetch(`/api/certificates/${cert.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        revokeReason: newStatus === "revoked" ? "Revoked by admin" : undefined,
      }),
    });

    if (res.ok) {
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === cert.id ? { ...c, status: newStatus } : c
        )
      );
    }
  };

  const columns: Column<CertificateRow>[] = [
    {
      key: "number",
      header: "Certificate #",
      render: (item) => (
        <span className="font-mono text-sm">{item.certificate_number}</span>
      ),
    },
    {
      key: "user",
      header: "Learner",
      render: (item) => (
        <span>{item.user?.full_name ?? "—"}</span>
      ),
    },
    {
      key: "course",
      header: "Course",
      render: (item) => (
        <span className="max-w-xs truncate block">
          {item.course?.title ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        switch (item.status) {
          case "issued":
            return <Badge variant="success">Issued</Badge>;
          case "revoked":
            return <Badge variant="destructive">Revoked</Badge>;
          case "expired":
            return <Badge variant="warning">Expired</Badge>;
          default:
            return <Badge>{item.status}</Badge>;
        }
      },
    },
    {
      key: "issued",
      header: "Issued",
      render: (item) => (
        <span className="text-sm">{formatDate(item.issued_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatus(item)}
          className="h-8 w-8 p-0"
          title={item.status === "issued" ? "Revoke" : "Reinstate"}
        >
          {item.status === "issued" ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {t("manageCertificates")}
      </h1>

      <Card>
        <CardHeader>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by certificate number..."
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={certificates}
            isLoading={isLoading}
            rowKey={(item) => item.id}
            emptyMessage="No certificates found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
