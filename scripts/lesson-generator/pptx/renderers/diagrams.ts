import PptxGenJS from 'pptxgenjs';
import type { VTimelineSlide, RoadmapSlide, CircularSlide, FunnelSlide, PyramidSlide } from '../../types';
import type { PptxColors } from '../theme';
import { CONTENT_COL, FONTS, MARGIN, SLIDE } from '../theme';
import { addTitle, addContentChrome, addCard } from '../helpers';

// ── Vertical Timeline ────────────────────────────────────────────────
export function renderVTimeline(slide: PptxGenJS.Slide, pres: PptxGenJS, data: VTimelineSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const startY = 0.7;
  const eventH = data.events.length <= 4 ? 1.0 : 0.75;
  const gap = 0.08;
  const lineX = CONTENT_COL.X + 0.2;

  // Vertical line
  slide.addShape(pres.shapes.LINE, {
    x: lineX, y: startY,
    w: 0, h: data.events.length * (eventH + gap) - gap,
    line: { color: colors.dark, width: 2 },
  });

  data.events.forEach((evt, i) => {
    const y = startY + i * (eventH + gap);

    // Dot
    slide.addShape(pres.shapes.OVAL, {
      x: lineX - 0.06, y: y + 0.12, w: 0.12, h: 0.12,
      fill: { color: colors.blue },
    });

    // Label
    slide.addText(evt.label, {
      x: lineX + 0.2, y: y + 0.04, w: 0.8, h: 0.25,
      fontSize: 9, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });

    // Title + desc
    slide.addText(evt.title, {
      x: lineX + 1.0, y: y + 0.04, w: CONTENT_COL.W - 1.3, h: 0.25,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
    });
    slide.addText(evt.description, {
      x: lineX + 1.0, y: y + 0.3, w: CONTENT_COL.W - 1.3, h: eventH - 0.38,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── Roadmap (horizontal phases) ──────────────────────────────────────
export function renderRoadmap(slide: PptxGenJS.Slide, pres: PptxGenJS, data: RoadmapSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const phaseCount = data.phases.length;
  const phaseW = (CONTENT_COL.W - (phaseCount - 1) * 0.1) / phaseCount;
  const startY = 0.6;
  const phaseH = 4.35;

  data.phases.forEach((phase, i) => {
    const x = CONTENT_COL.X + i * (phaseW + 0.1);

    addCard(slide, x, startY, phaseW, phaseH, colors);

    // Phase label
    slide.addText(phase.phase, {
      x: x + 0.08, y: startY + 0.08, w: phaseW - 0.16, h: 0.22,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.blue, charSpacing: 1, margin: 0,
    });

    // Phase title
    slide.addText(phase.title, {
      x: x + 0.08, y: startY + 0.3, w: phaseW - 0.16, h: 0.3,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
      autoFit: true,
    });

    // Items
    const items: PptxGenJS.TextProps[] = phase.items.map((item, j) => ({
      text: item,
      options: { bullet: true, breakLine: j < phase.items.length - 1, fontSize: 8, fontFace: FONTS.BODY, color: colors.gray },
    }));
    slide.addText(items, {
      x: x + 0.08, y: startY + 0.65, w: phaseW - 0.16, h: phaseH - 0.75,
      valign: 'top', margin: 0, autoFit: true,
    });
  });
}

// ── Circular Process ─────────────────────────────────────────────────
export function renderCircular(slide: PptxGenJS.Slide, pres: PptxGenJS, data: CircularSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const centerX = CONTENT_COL.X + CONTENT_COL.W / 2;
  const centerY = 2.8;
  const radius = 1.6;
  const stepCount = data.steps.length;

  // Center circle
  slide.addShape(pres.shapes.OVAL, {
    x: centerX - 0.5, y: centerY - 0.5, w: 1.0, h: 1.0,
    fill: { color: colors.blue },
  });
  slide.addText(data.center_label, {
    x: centerX - 0.5, y: centerY - 0.5, w: 1.0, h: 1.0,
    fontSize: 9, fontFace: FONTS.TITLE, color: colors.white, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Step circles arranged around center
  data.steps.forEach((step, i) => {
    const angle = (2 * Math.PI * i / stepCount) - Math.PI / 2;
    const sx = centerX + radius * Math.cos(angle);
    const sy = centerY + radius * Math.sin(angle);
    const circR = 0.35;

    // Step circle
    slide.addShape(pres.shapes.OVAL, {
      x: sx - circR, y: sy - circR, w: circR * 2, h: circR * 2,
      fill: { color: colors.card },
      line: { color: colors.blue, width: 1 },
    });

    // Step number
    slide.addText(`${i + 1}`, {
      x: sx - circR, y: sy - circR, w: circR * 2, h: circR * 2,
      fontSize: 12, fontFace: FONTS.TITLE, color: colors.blue, bold: true,
      align: 'center', valign: 'middle', margin: 0,
    });

    // Step title (positioned outside circle)
    const labelDist = radius + 0.55;
    const lx = centerX + labelDist * Math.cos(angle);
    const ly = centerY + labelDist * Math.sin(angle);
    slide.addText(step.title, {
      x: lx - 0.7, y: ly - 0.15, w: 1.4, h: 0.3,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.white,
      align: 'center', valign: 'middle', margin: 0,
    });
  });
}

// ── Funnel ───────────────────────────────────────────────────────────
export function renderFunnel(slide: PptxGenJS.Slide, pres: PptxGenJS, data: FunnelSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const stageCount = data.stages.length;
  const startY = 0.7;
  const totalH = 4.1;
  const stageH = totalH / stageCount;
  const maxW = CONTENT_COL.W;
  const minW = maxW * 0.5;

  data.stages.forEach((stage, i) => {
    const fraction = i / (stageCount - 1 || 1);
    const w = maxW - fraction * (maxW - minW);
    const x = CONTENT_COL.X + (maxW - w) / 2;
    const y = startY + i * stageH;
    const cardH = stageH - 0.06;

    addCard(slide, x, y, w, cardH, colors);

    // Stage label (left column: 28% of width)
    const labelW = w * 0.28;
    slide.addText(stage.label, {
      x: x + 0.1, y: y + 0.06, w: labelW, h: cardH - 0.12,
      fontSize: 10, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0, valign: 'middle',
    });

    // Value (right column: fixed width, non-overlapping)
    const valueW = stage.value ? 0.9 : 0;
    if (stage.value) {
      slide.addText(stage.value, {
        x: x + w - valueW - 0.05, y: y + 0.06, w: valueW, h: cardH - 0.12,
        fontSize: 10, fontFace: FONTS.TITLE, color: colors.white, bold: true,
        align: 'right', margin: 0, valign: 'middle',
      });
    }

    // Description (middle column: fills space between label and value)
    const descX = x + 0.1 + labelW + 0.05;
    const descEndX = x + w - valueW - (stage.value ? 0.15 : 0.1);
    const descW = Math.max(descEndX - descX, 0.3);
    const descFontSize = w < maxW * 0.7 ? 7 : 8;
    slide.addText(stage.description, {
      x: descX, y: y + 0.06, w: descW, h: cardH - 0.12,
      fontSize: descFontSize, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'middle',
      autoFit: true,
    });
  });
}

// ── Pyramid ──────────────────────────────────────────────────────────
export function renderPyramid(slide: PptxGenJS.Slide, pres: PptxGenJS, data: PyramidSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const levelCount = data.levels.length;
  const startY = 0.7;
  const totalH = 4.2;
  const levelH = totalH / levelCount;
  const maxW = CONTENT_COL.W;
  const minW = maxW * 0.3;

  // Pyramid is narrow at top, wide at bottom (reverse of funnel)
  data.levels.forEach((level, i) => {
    const fraction = i / (levelCount - 1 || 1);
    const w = minW + fraction * (maxW - minW);
    const x = CONTENT_COL.X + (maxW - w) / 2;
    const y = startY + i * levelH;
    const cardH = levelH - 0.06;

    addCard(slide, x, y, w, cardH, colors);

    slide.addText(level.label, {
      x: x + 0.1, y: y + 0.04, w: w - 0.2, h: 0.22,
      fontSize: 9, fontFace: FONTS.TITLE, color: colors.blue, bold: true,
      align: 'center', margin: 0,
    });
    slide.addText(level.description, {
      x: x + 0.1, y: y + 0.24, w: w - 0.2, h: cardH - 0.28,
      fontSize: 7, fontFace: FONTS.BODY, color: colors.gray,
      align: 'center', margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}
