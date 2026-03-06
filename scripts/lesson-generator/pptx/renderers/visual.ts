import PptxGenJS from 'pptxgenjs';
import type { TimelineSlide, ComparisonSlide, QuoteSlide } from '../../types';
import type { PptxColors } from '../theme';
import { CONTENT_COL, FONTS, MARGIN, SLIDE } from '../theme';
import { addTitle, addContentChrome, addCard, addAccentBar, addLogo } from '../helpers';

// ── Timeline (horizontal events) ─────────────────────────────────────
export function renderTimeline(slide: PptxGenJS.Slide, pres: PptxGenJS, data: TimelineSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const startY = 0.7;
  const eventH = data.events.length <= 4 ? 1.0 : 0.8;
  const gap = 0.1;

  data.events.forEach((evt, i) => {
    const y = startY + i * (eventH + gap);

    // Timeline dot + line
    const dotX = CONTENT_COL.X + 0.15;
    const dotY = y + 0.15;
    slide.addShape(pres.shapes.OVAL, {
      x: dotX, y: dotY, w: 0.14, h: 0.14,
      fill: { color: colors.blue },
    });

    // Connecting line (except last)
    if (i < data.events.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: dotX + 0.07, y: dotY + 0.14,
        w: 0, h: eventH + gap - 0.14,
        line: { color: colors.dark, width: 1.5 },
      });
    }

    // Year/label
    slide.addText(evt.year, {
      x: dotX + 0.25, y: y + 0.06, w: 0.8, h: 0.25,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });

    // Title + description
    slide.addText(evt.title, {
      x: dotX + 1.1, y: y + 0.06, w: CONTENT_COL.W - 1.4, h: 0.25,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
    });
    slide.addText(evt.description, {
      x: dotX + 1.1, y: y + 0.32, w: CONTENT_COL.W - 1.4, h: eventH - 0.42,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── Comparison ───────────────────────────────────────────────────────
export function renderComparison(slide: PptxGenJS.Slide, pres: PptxGenJS, data: ComparisonSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  // Table header
  const tableX = CONTENT_COL.X;
  const tableW = CONTENT_COL.W;
  const colW1 = tableW * 0.28; // Aspect column
  const colW2 = tableW * 0.36; // Left
  const colW3 = tableW * 0.36; // Right

  // Header row
  const headerY = 0.7;
  addCard(slide, tableX, headerY, tableW, 0.35, colors);

  slide.addText('', {
    x: tableX + 0.1, y: headerY + 0.05, w: colW1 - 0.2, h: 0.25,
    fontSize: 9, fontFace: FONTS.TITLE, color: colors.gray, margin: 0,
  });
  slide.addText(data.left_label, {
    x: tableX + colW1, y: headerY + 0.05, w: colW2, h: 0.25,
    fontSize: 9, fontFace: FONTS.TITLE, color: colors.blue, bold: true, align: 'center', margin: 0,
  });
  slide.addText(data.right_label, {
    x: tableX + colW1 + colW2, y: headerY + 0.05, w: colW3, h: 0.25,
    fontSize: 9, fontFace: FONTS.TITLE, color: colors.blue, bold: true, align: 'center', margin: 0,
  });

  // Data rows
  const rowH = data.rows.length <= 4 ? 0.7 : 0.55;
  data.rows.forEach((row, i) => {
    const y = headerY + 0.45 + i * (rowH + 0.06);
    addCard(slide, tableX, y, tableW, rowH, colors);

    slide.addText(row.aspect, {
      x: tableX + 0.1, y: y + 0.05, w: colW1 - 0.2, h: rowH - 0.1,
      fontSize: 9, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0, valign: 'middle',
    });
    slide.addText(row.left, {
      x: tableX + colW1 + 0.05, y: y + 0.05, w: colW2 - 0.1, h: rowH - 0.1,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'middle',
      autoFit: true,
    });
    slide.addText(row.right, {
      x: tableX + colW1 + colW2 + 0.05, y: y + 0.05, w: colW3 - 0.1, h: rowH - 0.1,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'middle',
      autoFit: true,
    });
  });

  // Verdict
  if (data.verdict) {
    slide.addText(data.verdict, {
      x: tableX, y: SLIDE.H - 0.65, w: tableW, h: 0.3,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.blue, align: 'center', margin: 0,
    });
  }
}

// ── Quote ────────────────────────────────────────────────────────────
export function renderQuote(slide: PptxGenJS.Slide, pres: PptxGenJS, data: QuoteSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);

  // Opening quote mark
  slide.addText('\u201C', {
    x: 1.5, y: 0.8, w: 1, h: 1,
    fontSize: 72, fontFace: 'Georgia', color: colors.blue, margin: 0,
  });

  // Quote text
  slide.addText(data.quote_text, {
    x: 1.5, y: 1.5, w: 7, h: 2.0,
    fontSize: 18, fontFace: 'Georgia', color: colors.white, italic: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Attribution
  slide.addText(data.attribution, {
    x: 1.5, y: 3.6, w: 7, h: 0.3,
    fontSize: 11, fontFace: FONTS.BODY, color: colors.blue, bold: true, align: 'center', margin: 0,
  });

  if (data.attribution_role) {
    slide.addText(data.attribution_role, {
      x: 1.5, y: 3.9, w: 7, h: 0.3,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, align: 'center', margin: 0,
    });
  }
}
