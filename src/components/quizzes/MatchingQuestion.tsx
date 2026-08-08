"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { QuizQuestion } from "@/types";

interface MatchingQuestionProps {
  question: QuizQuestion;
  /** prompt option id -> right-hand item handle */
  value: Record<string, string>;
  onChange: (matches: Record<string, string>) => void;
}

/**
 * Drag-to-pair answer input.
 *
 * Left column = the prompts, in the author's order. Right column = a shuffled
 * pool of the partners, each carrying an opaque handle (the server never sends
 * the pairing itself). Dragging a chip onto a prompt pairs them.
 *
 * Drag-and-drop is a mouse affordance only, so every interaction is also
 * reachable by tap/click: tap a chip to pick it up, tap a row to drop it. That
 * keeps the question answerable on phones and by keyboard users.
 */
export function MatchingQuestion({
  question,
  value,
  onChange,
}: MatchingQuestionProps) {
  const locale = useLocale();
  const tq = useTranslations("quiz");
  const isAr = locale === "ar";

  // Chip the learner has "picked up" by tapping (the click-to-pair path).
  const [heldKey, setHeldKey] = useState<string | null>(null);
  const [dragOverOptionId, setDragOverOptionId] = useState<string | null>(null);

  const prompts = question.options ?? [];
  const pool = useMemo(
    () => question.match_options ?? [],
    [question.match_options]
  );

  const byKey = useMemo(
    () => new Map(pool.map((m) => [m.key, m])),
    [pool]
  );

  // A chip can only sit in one slot, so anything already placed leaves the pool.
  const placedKeys = new Set(Object.values(value));

  const textOf = (m: { text: string; text_ar?: string | null }) =>
    isAr && m.text_ar ? m.text_ar : m.text;

  const assign = (optionId: string, key: string) => {
    const next: Record<string, string> = { ...value };
    // Moving a chip that's already placed elsewhere vacates the old slot.
    for (const [oid, k] of Object.entries(next)) {
      if (k === key) delete next[oid];
    }
    next[optionId] = key;
    onChange(next);
    setHeldKey(null);
  };

  const clear = (optionId: string) => {
    const next = { ...value };
    delete next[optionId];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{tq("matchInstructions")}</p>

      {/* Unplaced partners */}
      <div
        className="flex flex-wrap gap-2 rounded-lg border border-dashed p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          // Dropping back on the pool un-pairs the chip.
          const key = e.dataTransfer.getData("text/plain");
          const owner = Object.entries(value).find(([, k]) => k === key)?.[0];
          if (owner) clear(owner);
        }}
      >
        {pool.filter((m) => !placedKeys.has(m.key)).length === 0 ? (
          <span className="text-xs text-muted-foreground">
            {tq("matchAllPlaced")}
          </span>
        ) : (
          pool
            .filter((m) => !placedKeys.has(m.key))
            .map((m) => (
              <button
                key={m.key}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", m.key)}
                onClick={() => setHeldKey(heldKey === m.key ? null : m.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                  heldKey === m.key
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "bg-card hover:bg-muted/60"
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                {textOf(m)}
              </button>
            ))
        )}
      </div>

      {/* Prompts, each a drop target */}
      <div className="space-y-2">
        {prompts.map((opt) => {
          const placedKey = value[opt.id];
          const placed = placedKey ? byKey.get(placedKey) : undefined;
          const promptText =
            isAr && opt.option_text_ar ? opt.option_text_ar : opt.option_text;

          return (
            <div
              key={opt.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverOptionId(opt.id);
              }}
              onDragLeave={() => setDragOverOptionId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverOptionId(null);
                const key = e.dataTransfer.getData("text/plain");
                if (key) assign(opt.id, key);
              }}
              onClick={() => {
                if (heldKey) assign(opt.id, heldKey);
              }}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center",
                dragOverOptionId === opt.id && "border-primary bg-primary/5",
                heldKey && "cursor-pointer hover:border-primary"
              )}
            >
              <span className="flex-1 text-sm font-medium">{promptText}</span>

              <span className="hidden text-muted-foreground sm:inline">
                {isAr ? "←" : "→"}
              </span>

              <div className="min-h-[2.5rem] flex-1">
                {placed ? (
                  <span className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm">
                    {textOf(placed)}
                    <button
                      type="button"
                      aria-label={tq("matchRemove")}
                      onClick={(e) => {
                        e.stopPropagation();
                        clear(opt.id);
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                    {tq("matchDropHere")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
