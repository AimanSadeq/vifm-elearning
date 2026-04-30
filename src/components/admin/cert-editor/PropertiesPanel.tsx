"use client";

import type {
  CertElement,
  CertLayout,
  CircleElement,
  LineElement,
  RectElement,
  TextElement,
} from "@/lib/cert-layout/types";
import { PLACEHOLDERS } from "@/lib/cert-layout/types";
import { Trash2, Lock, Unlock } from "lucide-react";

interface PropertiesPanelProps {
  layout: CertLayout;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
  onAddText: () => void;
  onCanvasChange: (patch: Partial<Pick<CertLayout, "background">>) => void;
}

export function PropertiesPanel({
  layout,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onAddText,
  onCanvasChange,
}: PropertiesPanelProps) {
  const selected = layout.elements.find((el) => el.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Layer list */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Layers</h3>
          <button
            type="button"
            onClick={onAddText}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            + Add text
          </button>
        </div>
        <div className="max-h-44 overflow-y-auto px-2 pb-2">
          {layout.elements.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => onSelect(el.id)}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
                el.id === selectedId
                  ? "bg-brand-100 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
                  : "hover:bg-muted"
              }`}
            >
              <span className="truncate">
                {el.label ?? el.id} <span className="text-muted-foreground">· {el.type}</span>
              </span>
              {el.locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Selected element editor */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <CanvasProps layout={layout} onChange={onCanvasChange} />
        ) : selected.type === "text" ? (
          <TextProps el={selected} onUpdate={onUpdate} onDelete={onDelete} />
        ) : selected.type === "rect" ? (
          <RectProps el={selected} onUpdate={onUpdate} onDelete={onDelete} />
        ) : selected.type === "circle" ? (
          <CircleProps el={selected} onUpdate={onUpdate} onDelete={onDelete} />
        ) : (
          <LineProps el={selected} onUpdate={onUpdate} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

// ----- Canvas-level controls (shown when nothing is selected) ---------------
function CanvasProps({
  layout,
  onChange,
}: {
  layout: CertLayout;
  onChange: (patch: Partial<Pick<CertLayout, "background">>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold">Canvas</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Click any element to edit it, or drag to reposition. Click empty
          space to deselect and access canvas-level options.
        </p>
      </div>
      <Field label="Background">
        <ColorInput
          value={layout.background}
          onChange={(v) => onChange({ background: v })}
        />
      </Field>
    </div>
  );
}

// ----- Type-specific editors -----------------------------------------------
function TextProps({
  el,
  onUpdate,
  onDelete,
}: {
  el: TextElement;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Header el={el} onUpdate={onUpdate} onDelete={onDelete} />
      <Field label="Text">
        <textarea
          value={el.text}
          onChange={(e) => onUpdate(el.id, { text: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <details className="mt-1 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Insert placeholder
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {PLACEHOLDERS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => onUpdate(el.id, { text: el.text + " " + p })}
                className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono hover:bg-muted"
              >
                {p}
              </button>
            ))}
          </div>
        </details>
      </Field>

      <Row>
        <Field label="Font size">
          <NumberInput
            value={el.fontSize}
            onChange={(v) => onUpdate(el.id, { fontSize: v })}
            min={6}
            max={200}
            step={1}
          />
        </Field>
        <Field label="Weight">
          <select
            value={el.fontWeight}
            onChange={(e) =>
              onUpdate(el.id, {
                fontWeight: Number(e.target.value) as TextElement["fontWeight"],
              })
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={400}>400</option>
            <option value={500}>500</option>
            <option value={600}>600</option>
            <option value={700}>700</option>
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="Family">
          <select
            value={el.fontFamily}
            onChange={(e) =>
              onUpdate(el.id, {
                fontFamily: e.target.value as TextElement["fontFamily"],
              })
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="serif">Serif</option>
            <option value="sans">Sans-serif</option>
            <option value="mono">Mono</option>
          </select>
        </Field>
        <Field label="Style">
          <select
            value={el.fontStyle}
            onChange={(e) =>
              onUpdate(el.id, {
                fontStyle: e.target.value as TextElement["fontStyle"],
              })
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </Field>
      </Row>

      <Field label="Color">
        <ColorInput
          value={el.color}
          onChange={(v) => onUpdate(el.id, { color: v })}
        />
      </Field>

      <Row>
        <Field label="Align">
          <select
            value={el.align}
            onChange={(e) =>
              onUpdate(el.id, { align: e.target.value as TextElement["align"] })
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
        <Field label="Letter spacing">
          <NumberInput
            value={el.letterSpacing ?? 0}
            onChange={(v) => onUpdate(el.id, { letterSpacing: v })}
            min={0}
            max={20}
            step={0.5}
          />
        </Field>
      </Row>

      <PositionFields x={el.x} y={el.y} onUpdate={(p) => onUpdate(el.id, p)} />
    </div>
  );
}

function RectProps({
  el,
  onUpdate,
  onDelete,
}: {
  el: RectElement;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Header el={el} onUpdate={onUpdate} onDelete={onDelete} />
      <Row>
        <Field label="Width %">
          <NumberInput
            value={el.width}
            onChange={(v) => onUpdate(el.id, { width: v })}
            min={1}
            max={100}
            step={0.5}
          />
        </Field>
        <Field label="Height %">
          <NumberInput
            value={el.height}
            onChange={(v) => onUpdate(el.id, { height: v })}
            min={1}
            max={100}
            step={0.5}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Border color">
          <ColorInput
            value={el.borderColor}
            onChange={(v) => onUpdate(el.id, { borderColor: v })}
          />
        </Field>
        <Field label="Border width">
          <NumberInput
            value={el.borderWidth}
            onChange={(v) => onUpdate(el.id, { borderWidth: v })}
            min={0}
            max={10}
            step={0.25}
          />
        </Field>
      </Row>
      <Field label="Fill color (optional)">
        <ColorInput
          value={el.fillColor ?? "#ffffff"}
          onChange={(v) => onUpdate(el.id, { fillColor: v })}
          allowEmpty
          empty={el.fillColor === undefined}
          onClear={() => onUpdate(el.id, { fillColor: undefined })}
        />
      </Field>
      <PositionFields x={el.x} y={el.y} onUpdate={(p) => onUpdate(el.id, p)} />
    </div>
  );
}

function CircleProps({
  el,
  onUpdate,
  onDelete,
}: {
  el: CircleElement;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Header el={el} onUpdate={onUpdate} onDelete={onDelete} />
      <Field label="Diameter %">
        <NumberInput
          value={el.diameter}
          onChange={(v) => onUpdate(el.id, { diameter: v })}
          min={1}
          max={100}
          step={0.25}
        />
      </Field>
      <Row>
        <Field label="Border color">
          <ColorInput
            value={el.borderColor}
            onChange={(v) => onUpdate(el.id, { borderColor: v })}
          />
        </Field>
        <Field label="Border width">
          <NumberInput
            value={el.borderWidth}
            onChange={(v) => onUpdate(el.id, { borderWidth: v })}
            min={0}
            max={10}
            step={0.25}
          />
        </Field>
      </Row>
      <PositionFields x={el.x} y={el.y} onUpdate={(p) => onUpdate(el.id, p)} />
    </div>
  );
}

function LineProps({
  el,
  onUpdate,
  onDelete,
}: {
  el: LineElement;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Header el={el} onUpdate={onUpdate} onDelete={onDelete} />
      <Field label="Length %">
        <NumberInput
          value={el.length}
          onChange={(v) => onUpdate(el.id, { length: v })}
          min={1}
          max={100}
          step={0.5}
        />
      </Field>
      <Row>
        <Field label="Color">
          <ColorInput
            value={el.color}
            onChange={(v) => onUpdate(el.id, { color: v })}
          />
        </Field>
        <Field label="Thickness px">
          <NumberInput
            value={el.thickness}
            onChange={(v) => onUpdate(el.id, { thickness: v })}
            min={0.25}
            max={20}
            step={0.25}
          />
        </Field>
      </Row>
      <PositionFields x={el.x} y={el.y} onUpdate={(p) => onUpdate(el.id, p)} />
    </div>
  );
}

// ----- Building blocks ------------------------------------------------------
function Header({
  el,
  onUpdate,
  onDelete,
}: {
  el: CertElement;
  onUpdate: (id: string, patch: Partial<CertElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="min-w-0">
        <input
          type="text"
          value={el.label ?? ""}
          placeholder="Layer name"
          onChange={(e) => onUpdate(el.id, { label: e.target.value })}
          className="w-full bg-transparent text-sm font-semibold focus:outline-none"
        />
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {el.type}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdate(el.id, { locked: !el.locked })}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          title={el.locked ? "Unlock" : "Lock"}
        >
          {el.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(el.id)}
          className="rounded p-1 text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PositionFields({
  x,
  y,
  onUpdate,
}: {
  x: number;
  y: number;
  onUpdate: (patch: Partial<CertElement>) => void;
}) {
  return (
    <Row>
      <Field label="X %">
        <NumberInput
          value={x}
          onChange={(v) => onUpdate({ x: v })}
          min={0}
          max={100}
          step={0.5}
        />
      </Field>
      <Field label="Y %">
        <NumberInput
          value={y}
          onChange={(v) => onUpdate({ y: v })}
          min={0}
          max={100}
          step={0.5}
        />
      </Field>
    </Row>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      min={min}
      max={max}
      step={step}
      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
    />
  );
}

function ColorInput({
  value,
  onChange,
  allowEmpty,
  empty,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
  empty?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={empty ? "#ffffff" : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-input"
      />
      <input
        type="text"
        value={empty ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={empty ? "transparent" : undefined}
        className="h-8 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs"
      />
      {allowEmpty && !empty && (
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          clear
        </button>
      )}
    </div>
  );
}
