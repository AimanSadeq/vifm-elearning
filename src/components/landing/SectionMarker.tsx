"use client";

/**
 * Visual spine for the home page — same numbered section pattern as the
 * course/webinar detail pages, so the whole site reads as one piece.
 *
 * Render this above a <section> (or as its first child) to give the section
 * an editorial header. The eyebrow line uses small-caps tracking and is
 * pinned to the brand-blue accent; the title/subtitle render in normal weight
 * below it.
 */
export function SectionMarker({
  index,
  eyebrow,
  title,
  subtitle,
  align = "start",
}: {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div
      className={`mb-10 ${isCenter ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}`}
    >
      <div
        className={`flex items-baseline gap-3 ${isCenter ? "justify-center" : ""}`}
      >
        <span className="font-heading text-sm font-medium tabular-nums text-brand-600/80">
          {index}
        </span>
        <span className="h-px w-6 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight lg:text-4xl xl:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
