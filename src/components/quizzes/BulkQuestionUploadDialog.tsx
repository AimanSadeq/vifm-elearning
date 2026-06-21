"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Loader2, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// xlsx weighs ~1MB — defer the import to the moment the admin actually
// picks a file or downloads the template, instead of paying it on every
// quiz editor mount.
type XLSXModule = typeof import("xlsx");
let xlsxModulePromise: Promise<XLSXModule> | null = null;
function loadXLSX(): Promise<XLSXModule> {
  if (!xlsxModulePromise) xlsxModulePromise = import("xlsx");
  return xlsxModulePromise;
}

// Hard cap on a single import so the sequential POST loop doesn't run for
// minutes (and so a user can't accidentally fire 10K requests at the API).
const MAX_IMPORT_QUESTIONS = 100;

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "multi_select";

interface ParsedOption {
  optionText: string;
  optionTextAr?: string;
  isCorrect: boolean;
}

interface ParsedQuestion {
  rowNumber: number;
  ok: boolean;
  error?: string;
  questionText: string;
  questionTextAr?: string;
  questionType: QuestionType;
  points: number;
  explanation?: string;
  explanationAr?: string;
  options?: ParsedOption[];
}

const QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  "multiple_choice",
  "true_false",
  "short_answer",
  "multi_select",
]);

const TEMPLATE_ROWS = [
  {
    question: "What is 2 + 2?",
    question_ar: "كم يساوي ٢ + ٢؟",
    type: "multiple_choice",
    points: 1,
    option_1: "3",
    option_1_ar: "٣",
    correct_1: false,
    option_2: "4",
    option_2_ar: "٤",
    correct_2: true,
    option_3: "5",
    option_3_ar: "٥",
    correct_3: false,
    option_4: "6",
    option_4_ar: "٦",
    correct_4: false,
    explanation: "Basic addition",
    explanation_ar: "جمع بسيط",
  },
  {
    question: "The sky is blue.",
    type: "true_false",
    points: 1,
    option_1: "True",
    correct_1: true,
    option_2: "False",
    correct_2: false,
  },
  {
    question: "Which of these are programming languages? (multi-select)",
    type: "multi_select",
    points: 2,
    option_1: "Python",
    correct_1: true,
    option_2: "HTML",
    correct_2: false,
    option_3: "JavaScript",
    correct_3: true,
    option_4: "CSS",
    correct_4: false,
  },
];

function isPresent(v: unknown): boolean {
  // `0` (number) and `false` (boolean) are valid values — only treat
  // null / undefined / empty-string as "missing".
  return v !== null && v !== undefined && v !== "";
}

function pickField(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (isPresent(row[k])) return row[k];
    const lower = k.toLowerCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lower && isPresent(row[rowKey])) {
        return row[rowKey];
      }
    }
  }
  return undefined;
}

function asString(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = asString(v).toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "y";
}

function asNumber(v: unknown, fallback: number): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parses a single row from the spreadsheet into the question shape the API
 * expects. Lenient about column casing and accepts up to 6 options.
 */
function parseRow(row: Record<string, unknown>, rowNumber: number): ParsedQuestion {
  const questionText = asString(pickField(row, "question", "questionText"));
  if (!questionText) {
    return {
      rowNumber,
      ok: false,
      error: "Missing `question` text",
      questionText: "",
      questionType: "multiple_choice",
      points: 1,
    };
  }

  const rawType = asString(
    pickField(row, "type", "questionType", "question_type")
  ).toLowerCase() || "multiple_choice";
  const questionType = (
    QUESTION_TYPES.has(rawType as QuestionType) ? rawType : "multiple_choice"
  ) as QuestionType;

  // Bulk import doesn't yet collect a model/correct answer for free-text
  // questions, so a `short_answer` row would persist with no answer key
  // and never auto-grade. Reject it explicitly until we add a column for
  // the correct answer.
  if (questionType === "short_answer") {
    return {
      rowNumber,
      ok: false,
      error:
        "short_answer is not supported in bulk upload yet add it manually via Add Question",
      questionText,
      questionType,
      points: 1,
    };
  }

  const points = asNumber(pickField(row, "points"), 1);

  const options: ParsedOption[] = [];
  for (let i = 1; i <= 6; i++) {
    const text = asString(pickField(row, `option_${i}`, `option${i}`));
    if (!text) continue;
    const textAr = asString(pickField(row, `option_${i}_ar`, `option${i}_ar`));
    const isCorrect = asBool(pickField(row, `correct_${i}`, `correct${i}`));
    options.push({
      optionText: text,
      optionTextAr: textAr || undefined,
      isCorrect,
    });
  }

  // Validation specific to question types.
  if (
    (questionType === "multiple_choice" || questionType === "multi_select") &&
    options.length < 2
  ) {
    return {
      rowNumber,
      ok: false,
      error: `${questionType} needs at least two options`,
      questionText,
      questionType,
      points,
    };
  }
  if (
    questionType === "multiple_choice" &&
    options.filter((o) => o.isCorrect).length !== 1
  ) {
    return {
      rowNumber,
      ok: false,
      error: "multiple_choice needs exactly one correct option",
      questionText,
      questionType,
      points,
      options,
    };
  }
  if (
    questionType === "multi_select" &&
    options.filter((o) => o.isCorrect).length < 1
  ) {
    return {
      rowNumber,
      ok: false,
      error: "multi_select needs at least one correct option",
      questionText,
      questionType,
      points,
      options,
    };
  }
  if (questionType === "true_false") {
    if (options.length === 0) {
      // Auto-fill standard True/False options when admin omitted them.
      options.push(
        { optionText: "True", isCorrect: true },
        { optionText: "False", isCorrect: false }
      );
    } else if (options.filter((o) => o.isCorrect).length !== 1) {
      return {
        rowNumber,
        ok: false,
        error: "true_false needs exactly one correct option",
        questionText,
        questionType,
        points,
        options,
      };
    }
  }

  return {
    rowNumber,
    ok: true,
    questionText,
    questionTextAr: asString(pickField(row, "question_ar", "questionTextAr")) || undefined,
    questionType,
    points,
    explanation: asString(pickField(row, "explanation")) || undefined,
    explanationAr:
      asString(pickField(row, "explanation_ar", "explanationAr")) || undefined,
    options: options.length > 0 ? options : undefined,
  };
}

interface BulkQuestionUploadDialogProps {
  quizId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function BulkQuestionUploadDialog({
  quizId,
  onClose,
  onComplete,
}: BulkQuestionUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const validRows = parsed.filter((p) => p.ok);
  const invalidRows = parsed.filter((p) => !p.ok);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      const XLSX = await loadXLSX();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("Empty spreadsheet");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[firstSheet],
        { defval: "" }
      );
      if (rows.length === 0) throw new Error("No rows found");
      if (rows.length > MAX_IMPORT_QUESTIONS) {
        toast.error(
          `Too many rows (${rows.length}). Max ${MAX_IMPORT_QUESTIONS} per import split the file and upload again.`
        );
        setParsed([]);
        return;
      }
      const out = rows.map((row, i) => parseRow(row, i + 2 /* header is row 1 */));
      setParsed(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read file");
      setParsed([]);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    const XLSX = await loadXLSX();
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "quiz-questions-template.xlsx");
  }, []);

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) {
      toast.error("No valid questions to import");
      return;
    }
    setIsImporting(true);
    setProgress(0);
    const failedRows: number[] = [];
    let successCount = 0;
    for (let i = 0; i < validRows.length; i++) {
      const q = validRows[i];
      try {
        const res = await fetch(`/api/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText: q.questionText,
            questionTextAr: q.questionTextAr,
            questionType: q.questionType,
            points: q.points,
            explanation: q.explanation,
            explanationAr: q.explanationAr,
            options: q.options,
          }),
        });
        if (res.ok) successCount++;
        else failedRows.push(q.rowNumber);
      } catch {
        failedRows.push(q.rowNumber);
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }
    setIsImporting(false);
    if (failedRows.length === 0) {
      toast.success(
        `Imported ${successCount} question${successCount === 1 ? "" : "s"}`
      );
    } else {
      // Surface the row numbers admins need to look at, not just a count.
      const preview = failedRows.slice(0, 8).join(", ");
      const tail =
        failedRows.length > 8 ? ` and ${failedRows.length - 8} more` : "";
      toast.error(
        `Imported ${successCount} of ${validRows.length}. Failed rows: ${preview}${tail}.`
      );
    }
    onComplete();
    onClose();
  }, [quizId, validRows, onClose, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold">Bulk import questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload an Excel or CSV file. Each row becomes a question.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {parsed.length === 0 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop or pick a file</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      .xlsx or .csv first row should be column headers.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                  >
                    {isParsing ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="me-2 h-4 w-4" />
                    )}
                    Choose file
                  </Button>
                </CardContent>
              </Card>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Expected columns</p>
                <p className="mt-1 text-muted-foreground">
                  <code>question</code> · <code>type</code>{" "}
                  (multiple_choice / true_false / short_answer / multi_select)
                  · <code>points</code> · <code>option_1</code> …{" "}
                  <code>option_6</code> · <code>correct_1</code> …{" "}
                  <code>correct_6</code> (TRUE/FALSE) ·{" "}
                  <code>explanation</code>. Arabic columns:{" "}
                  <code>question_ar</code>, <code>option_1_ar</code>,
                  <code>explanation_ar</code>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="me-2 h-4 w-4" />
                  Download template
                </Button>
              </div>
            </div>
          )}

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <p>
                  <span className="font-medium">{validRows.length}</span>{" "}
                  valid · {invalidRows.length > 0 && (
                    <span className="text-destructive">
                      {invalidRows.length} with errors
                    </span>
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParsed([])}
                  disabled={isImporting}
                >
                  Clear
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                        Question
                      </th>
                      <th className="w-24 px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                        Type
                      </th>
                      <th className="w-20 px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsed.map((p) => (
                      <tr key={p.rowNumber} className={p.ok ? "" : "bg-destructive/5"}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {p.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          <p className="line-clamp-1">{p.questionText || "(empty)"}</p>
                          {!p.ok && (
                            <p className="text-xs text-destructive">{p.error}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {p.questionType}
                        </td>
                        <td className="px-3 py-2">
                          {p.ok ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Importing… {progress}%
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || isImporting}
          >
            {isImporting ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            Import {validRows.length} question{validRows.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </div>
  );
}
