import PptxGenJS from 'pptxgenjs';
import type { KeyPointsSlide, KPIStatsSlide, IconGridSlide, CaseStudySlide, DeepDiveSlide } from '../../types';
import type { PptxColors } from '../theme';
import { CONTENT_COL, FONTS, MARGIN, SLIDE } from '../theme';
import { addTitle, addContentChrome, addCard, addIconCircle } from '../helpers';

// ── Key Points (icon + title + description list) ─────────────────────
export function renderKeyPoints(slide: PptxGenJS.Slide, pres: PptxGenJS, data: KeyPointsSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  // Adaptive layout: fit all points within available vertical space
  const startY = 0.65;
  const maxContentH = 4.2;
  const n = data.points.length;
  const gap = n <= 3 ? 0.12 : 0.08;
  const cardH = Math.min((maxContentH - (n - 1) * gap) / n, 1.3);

  data.points.forEach((pt, i) => {
    const y = startY + i * (cardH + gap);
    addCard(slide, CONTENT_COL.X, y, CONTENT_COL.W, cardH, colors);

    // Icon circle (uses first letters of title as fallback)
    const iconSize = cardH < 0.8 ? 0.3 : 0.4;
    addIconCircle(slide, pres, pt.icon, CONTENT_COL.X + 0.12, y + 0.08, iconSize, colors, pt.title);

    // Point title
    const titleFontSize = cardH < 0.8 ? 10 : 12;
    slide.addText(pt.title, {
      x: CONTENT_COL.X + 0.12 + iconSize + 0.08, y: y + 0.08, w: CONTENT_COL.W - iconSize - 0.4, h: 0.25,
      fontSize: titleFontSize, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
    });

    // Point description
    slide.addText(pt.description, {
      x: CONTENT_COL.X + 0.12 + iconSize + 0.08, y: y + 0.34, w: CONTENT_COL.W - iconSize - 0.4, h: cardH - 0.42,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── KPI Stats (big numbers in cards) ─────────────────────────────────
export function renderKPIStats(slide: PptxGenJS.Slide, pres: PptxGenJS, data: KPIStatsSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const cols = 2;
  const cardW = (CONTENT_COL.W - 0.15) / cols;
  const cardH = 1.1;
  const startY = 0.8;

  data.stats.forEach((stat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = CONTENT_COL.X + col * (cardW + 0.15);
    const y = startY + row * (cardH + 0.15);

    addCard(slide, x, y, cardW, cardH, colors);

    // Big value
    slide.addText(stat.value, {
      x: x + 0.15, y: y + 0.12, w: cardW - 0.3, h: 0.5,
      fontSize: 24, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });

    // Label
    slide.addText(stat.label, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── Icon Grid ────────────────────────────────────────────────────────
export function renderIconGrid(slide: PptxGenJS.Slide, pres: PptxGenJS, data: IconGridSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const cols = data.items.length <= 4 ? 2 : 3;
  const cardW = (CONTENT_COL.W - (cols - 1) * 0.12) / cols;
  const startY = 0.8;
  const maxContentH = 4.0;
  const rows = Math.ceil(data.items.length / cols);
  const cardH = Math.min((maxContentH - (rows - 1) * 0.12) / rows, 1.94);

  data.items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = CONTENT_COL.X + col * (cardW + 0.12);
    const y = startY + row * (cardH + 0.12);

    addCard(slide, x, y, cardW, cardH, colors);

    addIconCircle(slide, pres, item.icon, x + 0.1, y + 0.1, 0.35, colors, item.title);
    slide.addText(item.title, {
      x: x + 0.1, y: y + 0.48, w: cardW - 0.2, h: 0.25,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
    });
    slide.addText(item.description, {
      x: x + 0.1, y: y + 0.73, w: cardW - 0.2, h: cardH - 0.83,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── Case Study ───────────────────────────────────────────────────────
export function renderCaseStudy(slide: PptxGenJS.Slide, pres: PptxGenJS, data: CaseStudySlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);

  // Company name as title (with accent)
  addTitle(slide, {
    label: 'Case Study',
    title: data.company,
    accent: data.company_accent,
  }, colors);

  // Background text
  slide.addText(data.background, {
    x: MARGIN.LEFT, y: 2.2, w: 2.8, h: 1.5,
    fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
  });

  // Challenge card
  addCard(slide, CONTENT_COL.X, 0.7, CONTENT_COL.W, 1.2, colors);
  slide.addText('CHALLENGE', {
    x: CONTENT_COL.X + 0.15, y: 0.78, w: CONTENT_COL.W - 0.3, h: 0.25,
    fontSize: 8, fontFace: FONTS.BODY, color: colors.blue, charSpacing: 2, margin: 0,
  });
  slide.addText(data.challenge, {
    x: CONTENT_COL.X + 0.15, y: 1.05, w: CONTENT_COL.W - 0.3, h: 0.75,
    fontSize: 10, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'top',
    autoFit: true,
  });

  // Results
  const resultStartY = 2.05;
  const resultH = 0.65;
  data.results.forEach((r, i) => {
    const y = resultStartY + i * (resultH + 0.1);
    addCard(slide, CONTENT_COL.X, y, CONTENT_COL.W, resultH, colors);
    slide.addText(r.value, {
      x: CONTENT_COL.X + 0.15, y: y + 0.06, w: CONTENT_COL.W - 0.3, h: 0.28,
      fontSize: 16, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });
    slide.addText(r.description, {
      x: CONTENT_COL.X + 0.15, y: y + 0.34, w: CONTENT_COL.W - 0.3, h: 0.25,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
    });
  });

  // Source
  if (data.source) {
    slide.addText(`Source: ${data.source}`, {
      x: CONTENT_COL.X, y: SLIDE.H - 0.5, w: CONTENT_COL.W, h: 0.2,
      fontSize: 7, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
    });
  }
}

// ── Deep Dive ────────────────────────────────────────────────────────
export function renderDeepDive(slide: PptxGenJS.Slide, pres: PptxGenJS, data: DeepDiveSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: MARGIN.LEFT, y: 2.2, w: 2.8, h: 0.8,
      fontSize: 10, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
    });
  }

  const startY = 0.65;
  const maxContentH = 4.2;
  const n = data.sections.length;
  const gap = 0.08;
  const sectionH = Math.min((maxContentH - (n - 1) * gap) / n, 1.8);

  data.sections.forEach((sec, i) => {
    const y = startY + i * (sectionH + gap);
    addCard(slide, CONTENT_COL.X, y, CONTENT_COL.W, sectionH, colors);

    slide.addText(sec.title, {
      x: CONTENT_COL.X + 0.15, y: y + 0.1, w: CONTENT_COL.W - 0.3, h: 0.3,
      fontSize: 11, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });
    slide.addText(sec.content, {
      x: CONTENT_COL.X + 0.15, y: y + 0.4, w: CONTENT_COL.W - 0.3, h: sectionH - 0.5,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}
