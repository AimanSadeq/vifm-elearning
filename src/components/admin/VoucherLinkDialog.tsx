"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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
import type { Voucher } from "@/types";

interface VoucherLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: Voucher | null;
}

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

/**
 * Builds a shareable checkout link for a voucher + course:
 *   /{locale}/courses/{slug}/checkout?voucher=CODE
 *
 * The checkout page prefills and auto-applies `?voucher=`, so whoever opens the
 * link lands on the enrolment page with the discount (or free access) already
 * applied. Unauthenticated visitors are bounced through login/register and come
 * back to the same URL — the middleware keeps the query string on the redirect.
 */
export function VoucherLinkDialog({
  open,
  onOpenChange,
  voucher,
}: VoucherLinkDialogProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [linkLocale, setLinkLocale] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const applicableCourses = useMemo(
    () => voucher?.applicable_courses ?? [],
    [voucher]
  );

  useEffect(() => {
    if (!open) return;

    async function fetchCourses() {
      setIsLoading(true);
      setCopied(false);
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("id, title, slug")
        .eq("status", "published")
        .order("title");

      const all = (data as CourseOption[]) ?? [];
      // A voucher restricted to specific courses can only be redeemed on those,
      // so don't offer links that the checkout would reject.
      const options =
        applicableCourses.length > 0
          ? all.filter((c) => applicableCourses.includes(c.id))
          : all;

      setCourses(options);
      // Pre-select when the voucher is locked to a single course.
      setSelectedCourseId(options.length === 1 ? options[0].id : "");
      setIsLoading(false);
    }

    fetchCourses();
  }, [open, applicableCourses]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const link =
    voucher && selectedCourse && typeof window !== "undefined"
      ? `${window.location.origin}/${linkLocale}/courses/${selectedCourse.slug}` +
        `/checkout?voucher=${encodeURIComponent(voucher.code)}`
      : "";

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Share Voucher Link</DialogTitle>
          <DialogDescription>
            Generate a checkout link for{" "}
            <strong className="font-mono">{voucher?.code}</strong>. Anyone who
            opens it goes straight to the course checkout with the voucher
            already applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published courses available for this voucher.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={(v) => {
                    setSelectedCourseId(v);
                    setCopied(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {applicableCourses.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    This voucher is restricted to{" "}
                    {applicableCourses.length === 1
                      ? "one course"
                      : `${applicableCourses.length} courses`}
                    .
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={linkLocale}
                  onValueChange={(v) => {
                    setLinkLocale(v);
                    setCopied(false);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {link && (
                <div className="space-y-2">
                  <Label>Shareable link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={link}
                      onFocus={(e) => e.currentTarget.select()}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ms-2">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {voucher?.voucher_type === "full_access"
                      ? "Full-access voucher — the learner enrolls for free with one click."
                      : "Discount voucher — the discount is applied before payment."}
                    {voucher?.max_uses
                      ? ` Usable ${voucher.max_uses - voucher.current_uses} more time(s).`
                      : " Unlimited uses."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {link && (
            <Button asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 me-2" />
                Preview
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
