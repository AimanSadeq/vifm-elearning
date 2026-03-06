import type { ThemeId } from '../types';
import { THEMES, type ThemeVars } from '../template/themes';

// ── Slide dimensions (16:9) ──────────────────────────────────────────
export const SLIDE = { W: 10, H: 5.625 } as const;

// ── Margins & layout constants (inches) ──────────────────────────────
export const MARGIN = {
  LEFT: 0.5,
  RIGHT: 0.5,
  TOP: 0.55,
  BOTTOM: 0.4,
} as const;

// Title column on left side of content slides
export const TITLE_COL = {
  X: MARGIN.LEFT,
  Y: 0.7,
  W: 2.8,
} as const;

// Content area on right side
export const CONTENT_COL = {
  X: 3.5,
  Y: 0.7,
  W: SLIDE.W - 3.5 - MARGIN.RIGHT,
} as const;

// Breadcrumb bar
export const BREADCRUMB = {
  X: MARGIN.LEFT,
  Y: 0.15,
  H: 0.25,
  FONT_SIZE: 7,
} as const;

// Progress dots
export const PROGRESS = {
  Y: 0.18,
  DOT_SIZE: 0.08,
  GAP: 0.14,
} as const;

// ── Font names ───────────────────────────────────────────────────────
export const FONTS = {
  TITLE: 'Arial',
  BODY: 'Arial',
  MONO: 'Consolas',
} as const;

// ── Color helpers ────────────────────────────────────────────────────
// pptxgenjs uses 6-char hex WITHOUT #
export function hexColor(cssColor: string): string {
  return cssColor.replace('#', '').replace(/^rgba?\(.*\)$/, '111D2E');
}

// Convert theme vars to pptx-safe hex colors
export interface PptxColors {
  bg: string;
  dark: string;
  green: string;
  mid: string;
  light: string;
  blue: string;
  blue2: string;
  white: string;
  gray: string;
  card: string;
}

export function getColors(themeId: ThemeId): PptxColors {
  const t = THEMES[themeId];
  return {
    bg: hexColor(t.bg),
    dark: hexColor(t.dark),
    green: hexColor(t.green),
    mid: hexColor(t.mid),
    light: hexColor(t.light),
    blue: hexColor(t.blue),
    blue2: hexColor(t.blue2),
    white: hexColor(t.white),
    gray: hexColor(t.gray),
    card: hexColor(t.card),
  };
}
