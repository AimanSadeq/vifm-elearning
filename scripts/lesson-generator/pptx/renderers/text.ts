import PptxGenJS from 'pptxgenjs';
import type {
  BigStatementSlide, NumberedListSlide, TwoColumnSlide, TermCardsSlide,
  DoDontSlide, RecapSlide, StepDetailSlide, QnASlide
} from '../../types';
import type { PptxColors } from '../theme';
import { CONTENT_COL, FONTS, MARGIN, SLIDE } from '../theme';
import { addTitle, addContentChrome, addCard, addAccentBar, addLogo, addIconCircle } from '../helpers';

// ── Big Statement (centered hero text) ───────────────────────────────
export function renderBigStatement(slide: PptxGenJS.Slide, pres: PptxGenJS, data: BigStatementSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);

  // Label
  if (data.label) {
    slide.addText(data.label.toUpperCase(), {
      x: 1, y: 1.0, w: 8, h: 0.3,
      fontSize: 10, fontFace: FONTS.BODY, color: colors.blue, charSpacing: 3,
      align: 'center', margin: 0,
    });
  }

  // Statement with accent
  if (data.statement_accent && data.statement.includes(data.statement_accent)) {
    const parts = data.statement.split(data.statement_accent);
    const textParts: PptxGenJS.TextProps[] = [];
    if (parts[0]) textParts.push({ text: parts[0], options: { color: colors.white, fontSize: 26, fontFace: FONTS.TITLE, bold: true } });
    textParts.push({ text: data.statement_accent, options: { color: colors.blue, fontSize: 26, fontFace: FONTS.TITLE, bold: true } });
    if (parts[1]) textParts.push({ text: parts[1], options: { color: colors.white, fontSize: 26, fontFace: FONTS.TITLE, bold: true } });
    slide.addText(textParts, { x: 1, y: 1.5, w: 8, h: 1.8, align: 'center', valign: 'middle', margin: 0 });
  } else {
    slide.addText(data.statement, {
      x: 1, y: 1.5, w: 8, h: 1.8,
      fontSize: 26, fontFace: FONTS.TITLE, color: colors.white, bold: true,
      align: 'center', valign: 'middle', margin: 0,
    });
  }

  // Sub text
  if (data.sub_text) {
    slide.addText(data.sub_text, {
      x: 1.5, y: 3.5, w: 7, h: 0.4,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, align: 'center', margin: 0,
    });
  }
}

// ── Numbered List ────────────────────────────────────────────────────
export function renderNumberedList(slide: PptxGenJS.Slide, pres: PptxGenJS, data: NumberedListSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  // Adaptive layout: fit all items within available vertical space
  const startY = 0.65;
  const maxContentH = 4.35;
  const n = data.items.length;
  const gap = n <= 4 ? 0.1 : 0.06;
  const itemH = Math.min((maxContentH - (n - 1) * gap) / n, 1.0);
  const compact = itemH < 0.7;

  data.items.forEach((item, i) => {
    const y = startY + i * (itemH + gap);
    addCard(slide, CONTENT_COL.X, y, CONTENT_COL.W, itemH, colors);

    // Number circle
    const circleSize = compact ? 0.24 : 0.32;
    const circleY = compact ? y + 0.06 : y + 0.1;
    slide.addShape(pres.shapes.OVAL, {
      x: CONTENT_COL.X + 0.1, y: circleY, w: circleSize, h: circleSize,
      fill: { color: colors.blue },
    });
    slide.addText(`${i + 1}`, {
      x: CONTENT_COL.X + 0.1, y: circleY, w: circleSize, h: circleSize,
      fontSize: compact ? 9 : 12, fontFace: FONTS.TITLE, color: colors.white, bold: true,
      align: 'center', valign: 'middle', margin: 0,
    });

    // Item text — compact mode uses tighter spacing
    const textX = CONTENT_COL.X + 0.1 + circleSize + 0.08;
    const textW = CONTENT_COL.W - circleSize - 0.28;
    const titleY = compact ? y + 0.04 : y + 0.06;
    const titleH = compact ? 0.2 : 0.25;
    const titleFontSize = compact ? 9 : 11;
    slide.addText(item.text, {
      x: textX, y: titleY, w: textW, h: titleH,
      fontSize: titleFontSize, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
    });
    if (item.detail) {
      const detailY = compact ? y + 0.24 : y + 0.32;
      const detailH = itemH - (detailY - y) - 0.06;
      slide.addText(item.detail, {
        x: textX, y: detailY, w: textW, h: detailH,
        fontSize: compact ? 8 : 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0, valign: 'top',
        autoFit: true,
      });
    }
  });
}

// ── Two Column ───────────────────────────────────────────────────────
export function renderTwoColumn(slide: PptxGenJS.Slide, pres: PptxGenJS, data: TwoColumnSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const colW = (CONTENT_COL.W - 0.15) / 2;
  const colH = 3.8;

  // Left column
  addCard(slide, CONTENT_COL.X, 0.7, colW, colH, colors);
  slide.addText(data.left_title, {
    x: CONTENT_COL.X + 0.15, y: 0.8, w: colW - 0.3, h: 0.3,
    fontSize: 11, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
  });

  const leftItems: PptxGenJS.TextProps[] = data.left_items.map((item, i) => ({
    text: item,
    options: { bullet: true, breakLine: i < data.left_items.length - 1, fontSize: 9, fontFace: FONTS.BODY, color: colors.white },
  }));
  slide.addText(leftItems, {
    x: CONTENT_COL.X + 0.15, y: 1.15, w: colW - 0.3, h: colH - 0.55,
    valign: 'top', margin: 0, autoFit: true,
  });

  // Right column
  const rightX = CONTENT_COL.X + colW + 0.15;
  addCard(slide, rightX, 0.7, colW, colH, colors);
  slide.addText(data.right_title, {
    x: rightX + 0.15, y: 0.8, w: colW - 0.3, h: 0.3,
    fontSize: 11, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
  });

  const rightItems: PptxGenJS.TextProps[] = data.right_items.map((item, i) => ({
    text: item,
    options: { bullet: true, breakLine: i < data.right_items.length - 1, fontSize: 9, fontFace: FONTS.BODY, color: colors.white },
  }));
  slide.addText(rightItems, {
    x: rightX + 0.15, y: 1.15, w: colW - 0.3, h: colH - 0.55,
    valign: 'top', margin: 0, autoFit: true,
  });
}

// ── Term Cards ───────────────────────────────────────────────────────
export function renderTermCards(slide: PptxGenJS.Slide, pres: PptxGenJS, data: TermCardsSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const cols = data.terms.length <= 4 ? 2 : 3;
  const cardW = (CONTENT_COL.W - (cols - 1) * 0.12) / cols;
  const startY = 0.65;
  const maxContentH = 4.2;
  const rows = Math.ceil(data.terms.length / cols);
  const cardH = Math.min((maxContentH - (rows - 1) * 0.12) / rows, 1.9);

  data.terms.forEach((term, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = CONTENT_COL.X + col * (cardW + 0.12);
    const y = startY + row * (cardH + 0.12);

    addCard(slide, x, y, cardW, cardH, colors);

    // Term
    slide.addText(term.term, {
      x: x + 0.12, y: y + 0.1, w: cardW - 0.24, h: 0.3,
      fontSize: 11, fontFace: FONTS.TITLE, color: colors.blue, bold: true, margin: 0,
    });

    // Definition
    slide.addText(term.definition, {
      x: x + 0.12, y: y + 0.42, w: cardW - 0.24, h: cardH - 0.52,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'top',
      autoFit: true,
    });
  });
}

// ── Do / Don't ───────────────────────────────────────────────────────
export function renderDoDont(slide: PptxGenJS.Slide, pres: PptxGenJS, data: DoDontSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  const colW = (CONTENT_COL.W - 0.15) / 2;
  const colH = 3.8;

  // Do column (green-tinted)
  addCard(slide, CONTENT_COL.X, 0.7, colW, colH, colors);
  slide.addText('DO', {
    x: CONTENT_COL.X + 0.15, y: 0.8, w: colW - 0.3, h: 0.3,
    fontSize: 11, fontFace: FONTS.TITLE, color: '4ECB71', bold: true, charSpacing: 2, margin: 0,
  });

  const doItems: PptxGenJS.TextProps[] = data.dos.map((d, i) => ({
    text: d.text,
    options: { bullet: true, breakLine: i < data.dos.length - 1, fontSize: 9, fontFace: FONTS.BODY, color: colors.white },
  }));
  slide.addText(doItems, {
    x: CONTENT_COL.X + 0.15, y: 1.15, w: colW - 0.3, h: colH - 0.55,
    valign: 'top', margin: 0, autoFit: true,
  });

  // Don't column (red-tinted)
  const dontX = CONTENT_COL.X + colW + 0.15;
  addCard(slide, dontX, 0.7, colW, colH, colors);
  slide.addText("DON'T", {
    x: dontX + 0.15, y: 0.8, w: colW - 0.3, h: 0.3,
    fontSize: 11, fontFace: FONTS.TITLE, color: 'FF6B6B', bold: true, charSpacing: 2, margin: 0,
  });

  const dontItems: PptxGenJS.TextProps[] = data.donts.map((d, i) => ({
    text: d.text,
    options: { bullet: true, breakLine: i < data.donts.length - 1, fontSize: 9, fontFace: FONTS.BODY, color: colors.white },
  }));
  slide.addText(dontItems, {
    x: dontX + 0.15, y: 1.15, w: colW - 0.3, h: colH - 0.55,
    valign: 'top', margin: 0, autoFit: true,
  });
}

// ── Recap ────────────────────────────────────────────────────────────
export function renderRecap(slide: PptxGenJS.Slide, pres: PptxGenJS, data: RecapSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);

  const title = data.title || 'Key Takeaways';
  addTitle(slide, { label: 'Recap', title }, colors);

  // Adaptive layout: fit all points within available vertical space
  const startY = 0.65;
  const maxContentH = 4.2;
  const n = data.points.length;
  const gap = n <= 4 ? 0.1 : 0.08;
  const itemH = Math.min((maxContentH - (n - 1) * gap) / n, 1.0);

  data.points.forEach((pt, i) => {
    const y = startY + i * (itemH + gap);
    addCard(slide, CONTENT_COL.X, y, CONTENT_COL.W, itemH, colors);

    const iconSize = itemH < 0.6 ? 0.28 : 0.35;
    if (pt.icon) {
      addIconCircle(slide, pres, pt.icon, CONTENT_COL.X + 0.12, y + 0.08, iconSize, colors, pt.text);
    }

    const textX = pt.icon ? CONTENT_COL.X + 0.12 + iconSize + 0.08 : CONTENT_COL.X + 0.15;
    const textW = pt.icon ? CONTENT_COL.W - iconSize - 0.35 : CONTENT_COL.W - 0.3;

    slide.addText(pt.text, {
      x: textX, y: y + 0.06, w: textW, h: itemH - 0.12,
      fontSize: itemH < 0.6 ? 8 : 10, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'middle',
      autoFit: true,
    });
  });
}

// ── Step Detail ──────────────────────────────────────────────────────
export function renderStepDetail(slide: PptxGenJS.Slide, pres: PptxGenJS, data: StepDetailSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  // Step number circle
  slide.addShape(pres.shapes.OVAL, {
    x: MARGIN.LEFT + 0.3, y: 2.5, w: 0.6, h: 0.6,
    fill: { color: colors.blue },
  });
  slide.addText(data.step_number, {
    x: MARGIN.LEFT + 0.3, y: 2.5, w: 0.6, h: 0.6,
    fontSize: 18, fontFace: FONTS.TITLE, color: colors.white, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Step title
  slide.addText(data.step_title, {
    x: MARGIN.LEFT, y: 3.2, w: 2.8, h: 0.4,
    fontSize: 12, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0,
  });

  // Description card
  addCard(slide, CONTENT_COL.X, 0.7, CONTENT_COL.W, 2.0, colors);
  slide.addText(data.description, {
    x: CONTENT_COL.X + 0.15, y: 0.8, w: CONTENT_COL.W - 0.3, h: 1.8,
    fontSize: 10, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'top',
    autoFit: true,
  });

  // Sub-steps
  if (data.sub_steps && data.sub_steps.length > 0) {
    const subItems: PptxGenJS.TextProps[] = data.sub_steps.map((s, i) => ({
      text: s,
      options: { bullet: true, breakLine: i < data.sub_steps!.length - 1, fontSize: 9, fontFace: FONTS.BODY, color: colors.gray },
    }));
    slide.addText(subItems, {
      x: CONTENT_COL.X + 0.15, y: 2.85, w: CONTENT_COL.W - 0.3, h: 2.0,
      valign: 'top', margin: 0,
    });
  }
}

// ── QnA (Question + Answer) ──────────────────────────────────────────
export function renderQnA(slide: PptxGenJS.Slide, pres: PptxGenJS, data: QnASlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);

  // Label
  if (data.label) {
    slide.addText(data.label.toUpperCase(), {
      x: MARGIN.LEFT, y: 0.7, w: 2.8, h: 0.25,
      fontSize: 8, fontFace: FONTS.BODY, color: colors.blue, charSpacing: 2, margin: 0,
    });
  }

  // Question
  slide.addText(data.question, {
    x: MARGIN.LEFT, y: 1.0, w: 2.8, h: 1.8,
    fontSize: 18, fontFace: FONTS.TITLE, color: colors.white, bold: true, margin: 0, valign: 'top',
  });

  // Answer card
  addCard(slide, CONTENT_COL.X, 0.7, CONTENT_COL.W, 4.0, colors);
  slide.addText(data.answer, {
    x: CONTENT_COL.X + 0.2, y: 0.85, w: CONTENT_COL.W - 0.4, h: 3.7,
    fontSize: 10, fontFace: FONTS.BODY, color: colors.white, margin: 0, valign: 'top',
    autoFit: true,
  });
}
