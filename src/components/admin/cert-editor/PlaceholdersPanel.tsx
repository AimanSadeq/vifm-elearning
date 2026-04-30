"use client";

import { Sparkles } from "lucide-react";

const DYNAMIC = new Set([
  "ATTENDEE_NAME",
  "COURSE_TITLE",
  "DATE",
  "DATE_RANGE",
  "CODE",
]);

const TODAY = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const DYNAMIC_PREVIEW: Record<string, string> = {
  ATTENDEE_NAME: "Sample Learner Name",
  COURSE_TITLE: "Sample Course Title",
  DATE: TODAY,
  DATE_RANGE: TODAY,
  CODE: "VIFM-PREVIEW-0001",
};

interface PlaceholdersPanelProps {
  placeholders: string[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  isLoading?: boolean;
}

export function PlaceholdersPanel({
  placeholders,
  values,
  onChange,
  isLoading,
}: PlaceholdersPanelProps) {
  if (isLoading) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground">Loading…</p>
    );
  }
  if (placeholders.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        No <code>{`{{TOKEN}}`}</code> placeholders found in the template.
      </p>
    );
  }

  const dynamic = placeholders.filter((p) => DYNAMIC.has(p));
  const staticOnes = placeholders.filter((p) => !DYNAMIC.has(p));

  return (
    <div className="space-y-4 px-4 py-4">
      {staticOnes.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Static placeholders
          </h4>
          <div className="space-y-2">
            {staticOnes.map((token) => (
              <label key={token} className="block">
                <span className="block font-mono text-[10px] font-medium text-muted-foreground">
                  {`{{${token}}}`}
                </span>
                <input
                  type="text"
                  value={values[token] ?? ""}
                  onChange={(e) =>
                    onChange({ ...values, [token]: e.target.value })
                  }
                  placeholder={`Value for ${token}`}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {dynamic.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Auto-filled at issue time
          </h4>
          <ul className="space-y-1.5 rounded-md border border-dashed border-border bg-muted/20 p-2.5">
            {dynamic.map((token) => (
              <li key={token} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {`{{${token}}}`}
                </span>
                <span className="truncate text-muted-foreground/80">
                  → {DYNAMIC_PREVIEW[token]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
