"use client";

import { useCallback, useRef, useState } from "react";
import type {
  CertElement,
  CertLayout,
  CircleElement,
  LineElement,
  RectElement,
  TextElement,
} from "@/lib/cert-layout/types";

const SAMPLE: Record<string, string> = {
  "{{ATTENDEE_NAME}}": "Sample Learner Name",
  "{{COURSE_TITLE}}": "Sample Course Title — Replace With Your Course",
  "{{DATE_RANGE}}": new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  "{{CODE}}": "VIFM-PREVIEW-0001",
  "{{CLIENT_NAME}}": "VIFM Academy",
  "{{CITY}}": "",
  "{{COUNTRY}}": "",
};

function fillPlaceholders(text: string): string {
  return text.replace(/\{\{[A-Z_]+\}\}/g, (m) => SAMPLE[m] ?? m);
}

const FONT_STACK: Record<TextElement["fontFamily"], string> = {
  serif: '"Times New Roman", Times, serif',
  sans: "var(--font-sans, system-ui), sans-serif",
  mono: '"SF Mono", Menlo, monospace',
};

/**
 * Returns the inclusive (min, max) percent range each axis can take so the
 * element's *bounding box* — not just the anchor point — stays on canvas.
 * Each element type has slightly different anchor semantics:
 *   - text:    anchor depends on align (left = top-left, center = top-center,
 *              right = top-right) and y is the vertical center
 *   - rect:    anchor is the top-left corner
 *   - circle:  anchor is the center
 *   - line:    anchor is the left end, y is the line itself
 */
function anchorBounds(el: CertElement): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (el.type === "text") {
    const widthPct = el.width ?? 0;
    const align = el.align;
    if (align === "center") {
      return { minX: widthPct / 2, maxX: 100 - widthPct / 2, minY: 0, maxY: 100 };
    }
    if (align === "right") {
      return { minX: widthPct, maxX: 100, minY: 0, maxY: 100 };
    }
    return { minX: 0, maxX: 100 - widthPct, minY: 0, maxY: 100 };
  }
  if (el.type === "rect") {
    return {
      minX: 0,
      maxX: Math.max(0, 100 - el.width),
      minY: 0,
      maxY: Math.max(0, 100 - el.height),
    };
  }
  if (el.type === "circle") {
    const r = el.diameter / 2;
    return { minX: r, maxX: 100 - r, minY: r, maxY: 100 - r };
  }
  // line
  return { minX: 0, maxX: Math.max(0, 100 - el.length), minY: 0, maxY: 100 };
}

interface CertificateCanvasProps {
  layout: CertLayout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export function CertificateCanvas({
  layout,
  selectedId,
  onSelect,
  onMove,
}: CertificateCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, el: CertElement) => {
      if (el.locked) {
        onSelect(el.id);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      onSelect(el.id);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cursorXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const cursorYPct = ((e.clientY - rect.top) / rect.height) * 100;
      dragOffset.current = {
        dx: cursorXPct - el.x,
        dy: cursorYPct - el.y,
      };
      setDragId(el.id);
    },
    [onSelect]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragId) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cursorXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const cursorYPct = ((e.clientY - rect.top) / rect.height) * 100;

      const dragged = layout.elements.find((el) => el.id === dragId);
      if (!dragged) return;

      // Compute the element's effective bounding box so we can clamp using
      // its real extents, not just the (x, y) anchor. Center-aligned text
      // anchored at x=100 would otherwise drag half off-canvas.
      const { minX, maxX, minY, maxY } = anchorBounds(dragged);
      const rawX = cursorXPct - dragOffset.current.dx;
      const rawY = cursorYPct - dragOffset.current.dy;
      const next = {
        x: Math.max(minX, Math.min(maxX, rawX)),
        y: Math.max(minY, Math.min(maxY, rawY)),
      };
      onMove(dragId, next.x, next.y);
    },
    [dragId, onMove, layout.elements]
  );

  const handleMouseUp = useCallback(() => {
    setDragId(null);
  }, []);

  return (
    <div
      className="relative w-full select-none"
      style={{ aspectRatio: `${layout.pageWidth} / ${layout.pageHeight}` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={canvasRef}
        className="absolute inset-0 overflow-hidden rounded-md shadow-lg ring-1 ring-black/5"
        style={{
          background: layout.background,
          // Establish the container-query context here so child text
          // elements can size their fonts as a fraction of canvas width
          // (cqw). Without this, cqw would fall back to the viewport.
          containerType: "inline-size",
        }}
        onMouseDown={() => onSelect(null)}
      >
        {layout.elements.map((el) => (
          <ElementBox
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onMouseDown={(e) => handleMouseDown(e, el)}
          />
        ))}
      </div>
    </div>
  );
}

function ElementBox({
  element,
  isSelected,
  onMouseDown,
}: {
  element: CertElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const outline = isSelected
    ? "outline outline-2 outline-offset-2 outline-brand-500"
    : "hover:outline hover:outline-1 hover:outline-brand-300";

  if (element.type === "text") {
    return <TextBox el={element} className={outline} onMouseDown={onMouseDown} />;
  }
  if (element.type === "rect") {
    return <RectBox el={element} className={outline} onMouseDown={onMouseDown} />;
  }
  if (element.type === "circle") {
    return <CircleBox el={element} className={outline} onMouseDown={onMouseDown} />;
  }
  if (element.type === "line") {
    return <LineBox el={element} className={outline} onMouseDown={onMouseDown} />;
  }
  return null;
}

function TextBox({
  el,
  className,
  onMouseDown,
}: {
  el: TextElement;
  className: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  // Width=100% if no explicit width — anchor by alignment so the (x, y) point
  // is at the natural anchor for that alignment.
  const useWidth = el.width !== undefined;
  const left = useWidth ? `${el.x - (el.width ?? 0) / 2}%` : "0";
  const right = useWidth ? undefined : "0";
  const transform =
    el.align === "center" && !useWidth
      ? "translate(-50%, -50%)"
      : el.align === "right" && !useWidth
        ? "translate(-100%, -50%)"
        : "translate(0, -50%)";
  return (
    <div
      className={`absolute cursor-move px-1 ${className}`}
      style={{
        left:
          el.align === "center" && !useWidth
            ? `${el.x}%`
            : el.align === "right" && !useWidth
              ? `${el.x}%`
              : useWidth
                ? left
                : `${el.x}%`,
        right: !useWidth && el.align === "left" ? undefined : right,
        top: `${el.y}%`,
        transform,
        width: useWidth ? `${el.width}%` : undefined,
        textAlign: el.align,
        fontFamily: FONT_STACK[el.fontFamily],
        fontSize: `${el.fontSize / 11.9}cqw`,
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle,
        color: el.color,
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
        lineHeight: 1.15,
        whiteSpace: useWidth ? "normal" : "nowrap",
      }}
      onMouseDown={onMouseDown}
    >
      {fillPlaceholders(el.text)}
    </div>
  );
}

function RectBox({
  el,
  className,
  onMouseDown,
}: {
  el: RectElement;
  className: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`absolute ${el.locked ? "cursor-default" : "cursor-move"} ${className}`}
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.width}%`,
        height: `${el.height}%`,
        border: `${el.borderWidth}px solid ${el.borderColor}`,
        background: el.fillColor ?? "transparent",
        borderRadius: el.radius ? `${el.radius}%` : undefined,
      }}
      onMouseDown={onMouseDown}
    />
  );
}

function CircleBox({
  el,
  className,
  onMouseDown,
}: {
  el: CircleElement;
  className: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`absolute cursor-move ${className}`}
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.diameter}%`,
        aspectRatio: "1",
        transform: "translate(-50%, -50%)",
        border: `${el.borderWidth}px solid ${el.borderColor}`,
        background: el.fillColor ?? "transparent",
        borderRadius: "50%",
      }}
      onMouseDown={onMouseDown}
    />
  );
}

function LineBox({
  el,
  className,
  onMouseDown,
}: {
  el: LineElement;
  className: string;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`absolute cursor-move ${className}`}
      style={{
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.length}%`,
        height: `${el.thickness}px`,
        background: el.color,
      }}
      onMouseDown={onMouseDown}
    />
  );
}
