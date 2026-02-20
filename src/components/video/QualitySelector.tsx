"use client";

import { useState, useRef, useEffect } from "react";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { HlsQualityLevel } from "@/lib/hooks/useHlsPlayer";

interface QualitySelectorProps {
  qualityLevels: HlsQualityLevel[];
  currentQualityIndex: number;
  onQualityChange: (index: number) => void;
}

export function QualitySelector({
  qualityLevels,
  currentQualityIndex,
  onQualityChange,
}: QualitySelectorProps) {
  const t = useTranslations("player");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (qualityLevels.length === 0) return null;

  const currentLabel =
    currentQualityIndex === -1
      ? t("qualityAuto")
      : qualityLevels.find((q) => q.index === currentQualityIndex)?.label ??
        t("qualityAuto");

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-white hover:text-brand-300"
        title={t("quality")}
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>

      {open && (
        <div className="absolute bottom-full end-0 mb-2 min-w-[120px] rounded-md bg-gray-900 py-1 shadow-lg">
          <button
            onClick={() => {
              onQualityChange(-1);
              setOpen(false);
            }}
            className={cn(
              "block w-full px-4 py-1.5 text-start text-xs text-white hover:bg-white/10",
              currentQualityIndex === -1 && "text-brand-400 font-medium"
            )}
          >
            {t("qualityAuto")}
          </button>
          {qualityLevels.map((level) => (
            <button
              key={level.index}
              onClick={() => {
                onQualityChange(level.index);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-4 py-1.5 text-start text-xs text-white hover:bg-white/10",
                currentQualityIndex === level.index &&
                  "text-brand-400 font-medium"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
