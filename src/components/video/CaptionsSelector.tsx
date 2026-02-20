"use client";

import { useState, useRef, useEffect } from "react";
import { Subtitles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

type CaptionLanguage = "off" | "en" | "ar";

interface CaptionsSelectorProps {
  captionLanguage: CaptionLanguage;
  onCaptionChange: (language: CaptionLanguage) => void;
  hasEnglish: boolean;
  hasArabic: boolean;
}

export function CaptionsSelector({
  captionLanguage,
  onCaptionChange,
  hasEnglish,
  hasArabic,
}: CaptionsSelectorProps) {
  const t = useTranslations("player");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (!hasEnglish && !hasArabic) return null;

  const options: { value: CaptionLanguage; label: string }[] = [
    { value: "off", label: t("captionsOff") },
  ];
  if (hasEnglish)
    options.push({ value: "en", label: t("captionsEnglish") });
  if (hasArabic) options.push({ value: "ar", label: t("captionsArabic") });

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-xs hover:text-brand-300",
          captionLanguage !== "off" ? "text-brand-400" : "text-white"
        )}
        title={t("captions")}
        aria-label={t("captions")}
      >
        <Subtitles className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full end-0 mb-2 min-w-[120px] rounded-md bg-gray-900 py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onCaptionChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-4 py-1.5 text-start text-xs text-white hover:bg-white/10",
                captionLanguage === option.value &&
                  "text-brand-400 font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
