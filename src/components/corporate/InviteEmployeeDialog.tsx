"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Invite a new employee, or (when `transferFrom` is set) replace a departed
 * employee: the server deactivates them, creates the replacement on the freed
 * seat, and moves open training assignments over.
 *
 * If the credential email could not be sent the server returns the temporary
 * password once; it is shown here so the admin can hand it over manually.
 */

interface TransferSource {
  id: string;
  name: string;
  email: string;
}

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  transferFrom?: TransferSource | null;
}

interface InviteResult {
  email: string;
  emailed: boolean;
  tempPassword?: string;
  assignmentsMoved?: number;
}

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  transferFrom = null,
}: InviteEmployeeDialogProps) {
  const isTransfer = transferFrom !== null;

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [fullNameAr, setFullNameAr] = useState("");
  const [department, setDepartment] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setFullName("");
    setFullNameAr("");
    setDepartment("");
    setLanguage("en");
    setResult(null);
  }, [open]);

  async function handleSubmit() {
    if (!email.trim() || fullName.trim().length < 2) {
      toast.error("Email and full name are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const url = isTransfer
        ? "/api/corporate/employees/transfer"
        : "/api/corporate/employees";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isTransfer ? { fromUserId: transferFrom.id } : {}),
          email: email.trim(),
          fullName: fullName.trim(),
          fullNameAr: fullNameAr.trim() || undefined,
          department: department.trim() || undefined,
          language,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");

      const data = json.data as InviteResult;
      setResult(data);
      onSuccess();
      if (data.emailed) {
        toast.success(
          isTransfer
            ? "License transferred and credentials emailed"
            : "Employee invited and credentials emailed",
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Request failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyPassword() {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      toast.success("Password copied");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isTransfer ? "Transfer License" : "Invite Employee"}
          </DialogTitle>
          <DialogDescription>
            {isTransfer
              ? `${transferFrom.name} (${transferFrom.email}) will be deactivated and their seat and open training assignments move to the new employee.`
              : "Creates a learner account on one of your seats and emails the sign-in credentials."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <span>
                Account created for <span className="font-medium">{result.email}</span>
                {typeof result.assignmentsMoved === "number" &&
                  result.assignmentsMoved > 0 &&
                  `, ${result.assignmentsMoved} open assignment${result.assignmentsMoved === 1 ? "" : "s"} moved`}
                .
              </span>
            </div>
            {result.emailed ? (
              <p className="text-sm text-muted-foreground">
                Sign-in credentials were emailed to the employee.
              </p>
            ) : (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
                <p className="text-sm font-medium">
                  The credential email could not be sent. Share this temporary
                  password with the employee now; it will not be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-background px-2 py-1 font-mono text-sm">
                    {result.tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                  >
                    <Copy className="me-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Work email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full name</Label>
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name-ar">Full name (Arabic, optional)</Label>
                <Input
                  id="invite-name-ar"
                  dir="rtl"
                  value={fullNameAr}
                  onChange={(e) => setFullNameAr(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-department">Department (optional)</Label>
                <Input
                  id="invite-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred language</Label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v as "en" | "ar")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isTransfer ? "Transfer" : "Invite"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
