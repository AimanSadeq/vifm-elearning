"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Copy,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  parseFile,
  generateTemplateCSV,
  type ParseResult,
  type ParsedUserRow,
} from "@/lib/utils/csv-parse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface CourseOption {
  id: string;
  title: string;
}

interface ImportResult {
  email: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
  userId?: string;
}

interface ImportResponse {
  voucherCode: string;
  voucherId: string;
  results: ImportResult[];
  summary: { total: number; created: number; skipped: number; failed: number };
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [accessExpiresAt, setAccessExpiresAt] = useState("");
  const [isFetchingCourses, setIsFetchingCourses] = useState(false);

  // Step 4 state
  const [isImporting, setIsImporting] = useState(false);
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const validRows = parseResult?.rows.filter((r) => r.isValid) ?? [];

  // Fetch published courses when dialog opens
  const fetchCourses = useCallback(async () => {
    setIsFetchingCourses(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .eq("status", "published")
      .order("title");
    setCourses((data as CourseOption[]) ?? []);
    setIsFetchingCourses(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchCourses();
      // Set default expiry to 90 days from now
      const d = new Date();
      d.setDate(d.getDate() + 90);
      setAccessExpiresAt(d.toISOString().slice(0, 16));
    }
  }, [open, fetchCourses]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setParseResult(null);
      setFileName("");
      setSelectedCourseIds([]);
      setAccessExpiresAt("");
      setImportResponse(null);
    }
  }, [open]);

  const handleFileSelect = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    const result = await parseFile(file);
    setParseResult(result);
    setIsParsing(false);

    if (result.parseError) {
      toast.error(result.parseError);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleImport = async () => {
    setStep(4);
    setIsImporting(true);

    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: validRows.map((r) => ({
            email: r.email,
            fullName: r.fullName,
            phone: r.phone || undefined,
            jobTitle: r.jobTitle || undefined,
            company: r.company || undefined,
          })),
          courseIds: selectedCourseIds,
          accessExpiresAt: new Date(accessExpiresAt).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResponse(data);
      toast.success(`${data.summary.created} users imported successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
      // Go back to review step on error
      setStep(3);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyVoucher = () => {
    if (importResponse?.voucherCode) {
      navigator.clipboard.writeText(importResponse.voucherCode);
      toast.success("Voucher code copied");
    }
  };

  const handleSendEmail = async () => {
    if (!importResponse) return;

    const createdUserIds = importResponse.results
      .filter((r) => r.status === "created" && r.userId)
      .map((r) => r.userId!);

    if (createdUserIds.length === 0) {
      toast.error("No new users to email");
      return;
    }

    setIsSendingEmail(true);

    try {
      const courseNames = courses
        .filter((c) => selectedCourseIds.includes(c.id))
        .map((c) => c.title);

      const res = await fetch("/api/admin/users/bulk/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: createdUserIds,
          voucherCode: importResponse.voucherCode,
          courseNames,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send emails");

      toast.success(`${data.sent} welcome emails sent (stub)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send emails";
      toast.error(message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const selectedCourseNames = courses
    .filter((c) => selectedCourseIds.includes(c.id))
    .map((c) => c.title);

  const canGoNext: Record<Step, boolean> = {
    1: (parseResult?.validRows ?? 0) > 0,
    2: selectedCourseIds.length > 0 && !!accessExpiresAt,
    3: true,
    4: false,
  };

  return (
    <Dialog open={open} onOpenChange={step === 4 && isImporting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>
            {step === 1 && "Upload a CSV or Excel file with user data."}
            {step === 2 && "Select courses and set access expiry."}
            {step === 3 && "Review and confirm import."}
            {step === 4 && (isImporting ? "Importing users..." : "Import complete.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="h-3 w-3" /> : s}
              </div>
              {s < 4 && (
                <div className={`h-px w-6 sm:w-10 ${s < step ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
            >
              {isParsing ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground text-center">
                {fileName
                  ? fileName
                  : "Drag & drop CSV/Excel file here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts .csv, .xlsx, .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="me-2 h-4 w-4" />
              Download Template
            </Button>

            {/* Parse Error */}
            {parseResult?.parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{parseResult.parseError}</p>
              </div>
            )}

            {/* Preview Table */}
            {parseResult && !parseResult.parseError && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="success">{parseResult.validRows} valid</Badge>
                  {parseResult.invalidRows > 0 && (
                    <Badge variant="destructive">{parseResult.invalidRows} invalid</Badge>
                  )}
                  <span className="text-muted-foreground">
                    {parseResult.totalRows} total rows
                  </span>
                </div>

                <div className="max-h-60 overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-start font-medium">#</th>
                        <th className="px-2 py-1.5 text-start font-medium">Email</th>
                        <th className="px-2 py-1.5 text-start font-medium hidden sm:table-cell">
                          Name
                        </th>
                        <th className="px-2 py-1.5 text-start font-medium hidden md:table-cell">
                          Phone
                        </th>
                        <th className="px-2 py-1.5 text-start font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={
                            row.isValid
                              ? ""
                              : "bg-destructive/5"
                          }
                        >
                          <td className="px-2 py-1 text-muted-foreground">
                            {row.rowNumber}
                          </td>
                          <td className="px-2 py-1 max-w-[180px] truncate">
                            {row.email || "—"}
                          </td>
                          <td className="px-2 py-1 hidden sm:table-cell max-w-[140px] truncate">
                            {row.fullName || "—"}
                          </td>
                          <td className="px-2 py-1 hidden md:table-cell">
                            {row.phone || "—"}
                          </td>
                          <td className="px-2 py-1">
                            {row.isValid ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <span
                                className="text-destructive cursor-help"
                                title={row.errors.join("; ")}
                              >
                                <AlertCircle className="h-3.5 w-3.5 inline" />{" "}
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Course Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Courses ({selectedCourseIds.length} selected)
              </label>
              {isFetchingCourses ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  No published courses found.
                </p>
              ) : (
                <div className="max-h-48 overflow-auto rounded-lg border p-2 space-y-1">
                  {courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded border-input"
                      />
                      {course.title}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Access Expires At
              </label>
              <Input
                type="datetime-local"
                value={accessExpiresAt}
                onChange={(e) => setAccessExpiresAt(e.target.value)}
              />
            </div>

            {/* Summary */}
            {selectedCourseIds.length > 0 && accessExpiresAt && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <FileSpreadsheet className="h-4 w-4 inline me-1" />
                <strong>{validRows.length}</strong> users will be enrolled in{" "}
                <strong>{selectedCourseIds.length}</strong> course
                {selectedCourseIds.length > 1 ? "s" : ""} until{" "}
                <strong>{new Date(accessExpiresAt).toLocaleDateString()}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm">Import Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Users to import:</span>
                <span className="font-medium">{validRows.length}</span>

                <span className="text-muted-foreground">Courses:</span>
                <span className="font-medium">
                  {selectedCourseNames.join(", ")}
                </span>

                <span className="text-muted-foreground">Access until:</span>
                <span className="font-medium">
                  {new Date(accessExpiresAt).toLocaleDateString()}
                </span>
              </div>

              {parseResult && parseResult.invalidRows > 0 && (
                <div className="flex items-start gap-2 rounded bg-yellow-50 dark:bg-yellow-900/20 p-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <span className="text-yellow-700 dark:text-yellow-300">
                    {parseResult.invalidRows} invalid row(s) will be skipped.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-4">
            {isImporting ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Creating users and enrollments...
                </p>
              </div>
            ) : importResponse ? (
              <>
                {/* Summary badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="success">
                    {importResponse.summary.created} Created
                  </Badge>
                  {importResponse.summary.skipped > 0 && (
                    <Badge variant="warning">
                      {importResponse.summary.skipped} Skipped
                    </Badge>
                  )}
                  {importResponse.summary.failed > 0 && (
                    <Badge variant="destructive">
                      {importResponse.summary.failed} Failed
                    </Badge>
                  )}
                </div>

                {/* Voucher code */}
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Voucher Code:</span>
                  <code className="font-mono font-medium text-sm">
                    {importResponse.voucherCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ms-auto"
                    onClick={handleCopyVoucher}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Results table */}
                <div className="max-h-48 overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-start font-medium">Email</th>
                        <th className="px-2 py-1.5 text-start font-medium">Status</th>
                        <th className="px-2 py-1.5 text-start font-medium hidden sm:table-cell">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResponse.results.map((r, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 max-w-[200px] truncate">
                            {r.email}
                          </td>
                          <td className="px-2 py-1">
                            <Badge
                              variant={
                                r.status === "created"
                                  ? "success"
                                  : r.status === "skipped"
                                    ? "warning"
                                    : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-2 py-1 text-muted-foreground hidden sm:table-cell">
                            {r.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Send Welcome Email */}
                {importResponse.summary.created > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="me-2 h-4 w-4" />
                    )}
                    Send Welcome Email ({importResponse.summary.created})
                  </Button>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Footer Navigation */}
        <DialogFooter className="gap-2">
          {step > 1 && step < 4 && (
            <Button
              variant="outline"
              onClick={() => setStep((step - 1) as Step)}
            >
              <ChevronLeft className="me-1 h-4 w-4" />
              Back
            </Button>
          )}

          {step < 3 && (
            <Button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canGoNext[step]}
            >
              Next
              <ChevronRight className="ms-1 h-4 w-4" />
            </Button>
          )}

          {step === 3 && (
            <Button onClick={handleImport}>
              <Upload className="me-2 h-4 w-4" />
              Import Users
            </Button>
          )}

          {step === 4 && !isImporting && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onSuccess();
              }}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
