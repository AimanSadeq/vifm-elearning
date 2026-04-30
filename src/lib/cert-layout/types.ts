// JSON-serializable description of a certificate. The canvas, the live
// preview, and the eventual server-side renderer all read from the same
// shape — keep this dependency-free so it can be imported from any context.

export type ElementType = "text" | "rect" | "circle" | "line";

export interface BaseElement {
  id: string;
  type: ElementType;
  /** Percentages of the canvas width — keeps the layout responsive. */
  x: number;
  /** Percentages of the canvas height. */
  y: number;
  /** Optional element label shown in the layer list. */
  label?: string;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  /** px at the canvas's intrinsic 1190 × 842 size — scales with zoom. */
  fontSize: number;
  fontFamily: "serif" | "sans" | "mono";
  fontWeight: 400 | 500 | 600 | 700;
  fontStyle: "normal" | "italic";
  color: string;
  align: "left" | "center" | "right";
  letterSpacing?: number;
  /** Width as a percentage of canvas — for wrapping. Optional; if omitted the text auto-sizes. */
  width?: number;
}

export interface RectElement extends BaseElement {
  type: "rect";
  width: number;
  height: number;
  borderColor: string;
  borderWidth: number;
  fillColor?: string;
  /** Border radius as a percent of the smaller side. */
  radius?: number;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  /** Diameter as a percent of the canvas width. */
  diameter: number;
  borderColor: string;
  borderWidth: number;
  fillColor?: string;
}

export interface LineElement extends BaseElement {
  type: "line";
  /** Length as a percent of canvas width. Always horizontal in v1. */
  length: number;
  color: string;
  thickness: number;
}

export type CertElement = TextElement | RectElement | CircleElement | LineElement;

export interface CertLayout {
  /** Canvas size in mm — A4 landscape by default. */
  pageWidth: number;
  pageHeight: number;
  background: string;
  elements: CertElement[];
}

/**
 * Tokens that get substituted into text elements at generation time. The
 * editor UI can show a "Insert placeholder" menu so admins don't have to
 * remember the exact spelling.
 */
export const PLACEHOLDERS = [
  "{{ATTENDEE_NAME}}",
  "{{COURSE_TITLE}}",
  "{{DATE_RANGE}}",
  "{{CODE}}",
  "{{CLIENT_NAME}}",
  "{{CITY}}",
  "{{COUNTRY}}",
] as const;
