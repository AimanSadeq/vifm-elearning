import PptxGenJS from 'pptxgenjs';
import { ShapeType } from 'pptxgenjs';
import * as path from 'path';
import { BREADCRUMB, PROGRESS, MARGIN, SLIDE, TITLE_COL, FONTS, type PptxColors } from './theme';

const LOGO_PATH = path.resolve(__dirname, '..', 'assets', 'vifm-logo-white.png');
const ICONS_DIR = path.resolve(__dirname, '..', 'assets', 'icons');

// ── Breadcrumb bar at top ────────────────────────────────────────────
export function addBreadcrumb(slide: PptxGenJS.Slide, text: string, colors: PptxColors): void {
  slide.addText(text, {
    x: BREADCRUMB.X,
    y: BREADCRUMB.Y,
    w: 7,
    h: BREADCRUMB.H,
    fontSize: BREADCRUMB.FONT_SIZE,
    fontFace: FONTS.BODY,
    color: colors.gray,
    valign: 'middle',
    margin: 0,
  });
}

// ── Progress dots ────────────────────────────────────────────────────
export function addProgress(slide: PptxGenJS.Slide, progress: number[], colors: PptxColors, _pres: PptxGenJS): void {
  if (!progress || progress.length === 0) return;
  const totalW = progress.length * PROGRESS.GAP;
  const startX = SLIDE.W - MARGIN.RIGHT - totalW;

  for (let i = 0; i < progress.length; i++) {
    const filled = progress[i] === 1;
    slide.addShape(ShapeType.ellipse, {
      x: startX + i * PROGRESS.GAP,
      y: PROGRESS.Y,
      w: PROGRESS.DOT_SIZE,
      h: PROGRESS.DOT_SIZE,
      fill: { color: filled ? colors.blue : colors.dark },
      line: { color: colors.gray, width: 0.5 },
    });
  }
}

// ── VIFM logo image (bottom-left) ────────────────────────────────────
export function addLogo(slide: PptxGenJS.Slide, colors: PptxColors): void {
  // Logo aspect ratio: 1755x396 ≈ 4.43:1
  const logoH = 0.2;
  const logoW = logoH * (1755 / 396);
  slide.addImage({
    path: LOGO_PATH,
    x: MARGIN.LEFT,
    y: SLIDE.H - MARGIN.BOTTOM - 0.1,
    w: logoW,
    h: logoH,
  });
}

// ── Modern icon circle (replaces emojis with PNG icons) ──────────────
const EMOJI_ICON_MAP: Record<string, string> = {
  '📊': 'chart', '📈': 'trend', '📉': 'chart',
  '💰': 'money', '💵': 'money', '💳': 'money',
  '🔍': 'search', '🔎': 'search',
  '🎯': 'target', '🏆': 'target',
  '⚡': 'bolt', '🔥': 'bolt',
  '🤖': 'brain', '🧠': 'brain',
  '📋': 'clipboard', '📄': 'document', '📝': 'document', '📖': 'document',
  '🔒': 'shield', '🛡️': 'shield',
  '⚙️': 'gear', '🔧': 'gear',
  '👁️': 'eye', '👀': 'eye',
  '💡': 'bulb', '✨': 'bulb',
  '🌐': 'globe', '🌍': 'globe',
  '📱': 'phone', '💻': 'screen',
  '🔄': 'refresh', '♻️': 'refresh',
  '📦': 'gear', '🏗️': 'building',
  '👥': 'people', '👤': 'people',
  '⏱️': 'clock', '🕐': 'clock', '⏰': 'clock', '🕰️': 'clock',
  '✅': 'check', '❌': 'no',
  '📡': 'satellite', '🔗': 'web',
  '🏢': 'building', '🏦': 'building', '🏛️': 'building', '🏭': 'building',
  '💬': 'chat', '🗣️': 'chat',
  '☀️': 'sun',
  '🎲': 'dice',
  '🔀': 'shuffle',
  '📏': 'ruler', '📐': 'ruler',
  '⚖️': 'scale',
  '🎬': 'film', '🎤': 'mic',
  '🔮': 'crystal',
  '👔': 'tie',
  '🎓': 'grad',
  '🚫': 'no',
  '🌳': 'tree',
  '🕸️': 'web',
  '🔬': 'microscope',
  '📞': 'phone',
  '📰': 'newspaper',
  '🛰️': 'satellite',
  '🚨': 'alert',
  '🔢': 'hash',
  '💾': 'disk',
};

export function addIconCircle(
  slide: PptxGenJS.Slide,
  pres: PptxGenJS,
  emoji: string,
  x: number, y: number, size: number,
  colors: PptxColors,
  title?: string
): void {
  // Circle background
  slide.addShape(ShapeType.ellipse, {
    x, y, w: size, h: size,
    fill: { color: colors.blue, transparency: 80 },
    line: { color: colors.blue, width: 0.75 },
  });

  // Numbers stay as text (recap slides use "1", "2", etc.)
  const isNumber = /^\d+$/.test(emoji);
  if (isNumber) {
    slide.addText(emoji, {
      x, y, w: size, h: size,
      fontSize: size * 28,
      fontFace: FONTS.TITLE,
      color: colors.blue,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    return;
  }

  // Look up icon PNG
  const iconName = EMOJI_ICON_MAP[emoji] || 'document';
  const iconPath = path.join(ICONS_DIR, `${iconName}.png`);

  // Embed icon image inside circle (with padding)
  const pad = size * 0.22;
  slide.addImage({
    path: iconPath,
    x: x + pad,
    y: y + pad,
    w: size - pad * 2,
    h: size - pad * 2,
  });
}

// ── Bottom accent bar ────────────────────────────────────────────────
export function addAccentBar(slide: PptxGenJS.Slide, colors: PptxColors): void {
  slide.addShape('rect' as any, {
    x: 0,
    y: SLIDE.H - 0.04,
    w: SLIDE.W,
    h: 0.04,
    fill: { color: colors.blue },
  });
}

// ── Title block (label + title with accent) ──────────────────────────
export interface TitleOptions {
  label?: string;
  title: string;
  accent?: string;
  x?: number;
  y?: number;
  w?: number;
}

export function addTitle(slide: PptxGenJS.Slide, opts: TitleOptions, colors: PptxColors): void {
  const x = opts.x ?? TITLE_COL.X;
  const y = opts.y ?? TITLE_COL.Y;
  const w = opts.w ?? TITLE_COL.W;

  let currentY = y;

  // Label (small caps above title)
  if (opts.label) {
    slide.addText(opts.label.toUpperCase(), {
      x, y: currentY, w, h: 0.25,
      fontSize: 8,
      fontFace: FONTS.BODY,
      color: colors.blue,
      charSpacing: 2,
      margin: 0,
    });
    currentY += 0.25;
  }

  // Title with optional accent
  if (opts.accent && opts.title.includes(opts.accent)) {
    const parts = opts.title.split(opts.accent);
    const textParts: PptxGenJS.TextProps[] = [];
    if (parts[0]) {
      textParts.push({ text: parts[0], options: { color: colors.white, bold: true, fontSize: 22, fontFace: FONTS.TITLE } });
    }
    textParts.push({ text: opts.accent, options: { color: colors.blue, bold: true, fontSize: 22, fontFace: FONTS.TITLE } });
    if (parts[1]) {
      textParts.push({ text: parts[1], options: { color: colors.white, bold: true, fontSize: 22, fontFace: FONTS.TITLE } });
    }
    slide.addText(textParts, { x, y: currentY, w, h: 1.2, valign: 'top', margin: 0 });
  } else {
    slide.addText(opts.title, {
      x, y: currentY, w, h: 1.2,
      fontSize: 22,
      fontFace: FONTS.TITLE,
      color: colors.white,
      bold: true,
      valign: 'top',
      margin: 0,
    });
  }
}

// ── Card background rectangle ────────────────────────────────────────
export function addCard(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  colors: PptxColors
): void {
  slide.addShape('rect' as any, {
    x, y, w, h,
    fill: { color: colors.card },
    rectRadius: 0.06,
    line: { color: colors.dark, width: 0.5 },
  });
}

// ── Standard content slide chrome ────────────────────────────────────
export function addContentChrome(
  slide: PptxGenJS.Slide,
  pres: PptxGenJS,
  data: { breadcrumb?: string; progress?: number[] },
  colors: PptxColors
): void {
  if (data.breadcrumb) addBreadcrumb(slide, data.breadcrumb, colors);
  if (data.progress) addProgress(slide, data.progress, colors, pres);
  addLogo(slide, colors);
  addAccentBar(slide, colors);
}
