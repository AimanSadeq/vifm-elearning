"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils/formatters";

type Status = "new" | "read" | "responded" | "archived";

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: Status;
  created_at: string;
}

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "responded", label: "Responded" },
  { key: "archived", label: "Archived" },
];

const STATUS_VARIANT: Record<
  Status,
  "default" | "secondary" | "success" | "warning"
> = {
  new: "default",
  read: "secondary",
  responded: "success",
  archived: "warning",
};

export default function AdminMessagesPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contact_submissions")
      .select("id, name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false });
    setItems((data as Submission[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: Status) => {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    const supabase = createClient();
    await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", id);
  };

  const visible =
    filter === "all" ? items : items.filter((m) => m.status === filter);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Contact Messages</h1>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? items.length
                : items.filter((m) => m.status === f.key).length;
            return (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No messages"
          description="Messages submitted from the Contact page will appear here."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.name} ·{" "}
                      <a
                        href={`mailto:${m.email}`}
                        className="text-brand-600 hover:underline"
                      >
                        {m.email}
                      </a>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {m.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(
                      `Re: ${m.subject}`,
                    )}`}
                  >
                    <Button size="sm" variant="outline" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Reply
                    </Button>
                  </a>
                  {m.status !== "read" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(m.id, "read")}
                    >
                      Mark read
                    </Button>
                  )}
                  {m.status !== "responded" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(m.id, "responded")}
                    >
                      Mark responded
                    </Button>
                  )}
                  {m.status !== "archived" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(m.id, "archived")}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
