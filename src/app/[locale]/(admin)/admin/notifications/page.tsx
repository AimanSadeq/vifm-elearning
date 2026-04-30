"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { reportSupabaseError } from "@/lib/utils/supabase-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatRelativeDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface SentNotification {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  created_at: string;
  user_name?: string;
}

type RecipientType = "all" | "role" | "specific";

export default function AdminNotificationsPage() {
  const t = useTranslations("admin");

  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  // Compose form state
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [recipientRole, setRecipientRole] = useState("learner");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"in_app" | "email">("in_app");

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, title, body, channel, status, created_at, user:profiles!notifications_user_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      reportSupabaseError(error, "Could not load notifications");
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const mapped: SentNotification[] = (data ?? []).map(
      (n: Record<string, unknown>) => ({
        id: n.id as string,
        title: n.title as string,
        body: n.body as string,
        channel: n.channel as string,
        status: n.status as string,
        created_at: n.created_at as string,
        user_name:
          (n.user as Record<string, unknown>)?.full_name as string ??
          "Unknown",
      })
    );

    setNotifications(mapped);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async () => {
    setIsSending(true);
    const supabase = createClient();

    let userIds: string[] = [];
    let lookupError: string | null = null;

    if (recipientType === "all") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_active", true);
      lookupError = error?.message ?? null;
      userIds = (data ?? []).map((u) => u.id);
    } else if (recipientType === "role") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", recipientRole)
        .eq("is_active", true);
      lookupError = error?.message ?? null;
      userIds = (data ?? []).map((u) => u.id);
    } else {
      const email = recipientEmail.trim();
      if (!email) {
        setIsSending(false);
        toast.error("Enter a recipient email address.");
        return;
      }
      // ilike is case-insensitive — admins routinely paste mixed-case
      // addresses; storing always-lowercase isn't enforced.
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email);
      lookupError = error?.message ?? null;
      userIds = (data ?? []).map((u) => u.id);
    }

    if (lookupError) {
      setIsSending(false);
      toast.error(`Could not look up recipients: ${lookupError}`);
      return;
    }

    if (userIds.length === 0) {
      setIsSending(false);
      toast.error("No matching recipients found — nothing was sent.");
      return;
    }

    const records = userIds.map((userId) => ({
      user_id: userId,
      channel,
      status: "sent",
      title: subject,
      body: message,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(records);

    setIsSending(false);

    if (insertError) {
      toast.error(`Could not send notification: ${insertError.message}`);
      return;
    }

    toast.success(`Sent to ${userIds.length} recipient${userIds.length === 1 ? "" : "s"}`);
    setShowCompose(false);
    setSubject("");
    setMessage("");
    setRecipientEmail("");
    fetchNotifications();
  };

  const columns: Column<SentNotification>[] = [
    {
      key: "title",
      header: "Subject",
      render: (item) => (
        <div>
          <span className="font-medium">{item.title}</span>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.body}
          </p>
        </div>
      ),
    },
    {
      key: "recipient",
      header: "Recipient",
      render: (item) => (
        <span className="text-sm">{item.user_name}</span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (item) => (
        <Badge variant="outline">{item.channel}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={item.status === "sent" ? "success" : "secondary"}
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(item.created_at)}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {t("notifications")}
        </h1>
        <Button size="sm" onClick={() => setShowCompose(true)}>
          <Send className="h-4 w-4 me-1" />
          Compose
        </Button>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex items-center gap-2">
                {(
                  [
                    { key: "all", label: "All Users" },
                    { key: "role", label: "By Role" },
                    { key: "specific", label: "Specific User" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.key}
                    variant={
                      recipientType === opt.key ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setRecipientType(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {recipientType === "role" && (
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
                  )}
                >
                  <option value="learner">Learner</option>
                  <option value="instructor">Instructor</option>
                  <option value="corporate_admin">Corporate Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            )}

            {recipientType === "specific" && (
              <div className="space-y-2">
                <Label>User Email</Label>
                <Input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="max-w-sm"
                />
              </div>
            )}

            {/* Channel */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={channel === "in_app" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChannel("in_app")}
                >
                  In-App
                </Button>
                <Button
                  variant={channel === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChannel("email")}
                >
                  Email
                </Button>
              </div>
            </div>

            {/* Subject & Message */}
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Notification subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notification message..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !subject || !message}
              >
                {isSending && (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                )}
                Send Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Notifications Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={notifications}
            rowKey={(item) => item.id}
            emptyMessage="No notifications sent yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
