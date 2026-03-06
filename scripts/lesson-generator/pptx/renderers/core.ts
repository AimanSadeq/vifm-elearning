import PptxGenJS from 'pptxgenjs';
import type { IntroSlide, ModuleTitleSlide, OutroSlide } from '../../types';
import type { PptxColors } from '../theme';
import { SLIDE, FONTS } from '../theme';
import { addAccentBar, addLogo } from '../helpers';

// ── Intro Slide ──────────────────────────────────────────────────────
export function renderIntro(slide: PptxGenJS.Slide, pres: PptxGenJS, data: IntroSlide, colors: PptxColors): void {
  // Course code
  slide.addText(data.course_code, {
    x: 0.5, y: 1.0, w: 9, h: 0.4,
    fontSize: 14,
    fontFace: FONTS.BODY,
    color: colors.blue,
    charSpacing: 4,
    align: 'center',
    margin: 0,
  });

  // Course title
  slide.addText(data.course_title, {
    x: 0.5, y: 1.5, w: 9, h: 1.0,
    fontSize: 32,
    fontFace: FONTS.TITLE,
    color: colors.white,
    bold: true,
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  // Subtitle
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1, y: 2.6, w: 8, h: 0.6,
      fontSize: 14,
      fontFace: FONTS.BODY,
      color: colors.gray,
      align: 'center',
      margin: 0,
    });
  }

  // Lesson number
  if (data.lesson_number) {
    slide.addText(data.lesson_number, {
      x: 1, y: 3.4, w: 8, h: 0.4,
      fontSize: 12,
      fontFace: FONTS.BODY,
      color: colors.blue,
      align: 'center',
      margin: 0,
    });
  }

  // Decorative line
  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 3.2, w: 3, h: 0,
    line: { color: colors.blue, width: 1 },
  });

  addLogo(slide, colors);
  addAccentBar(slide, colors);
}

// ── Module Title Slide ───────────────────────────────────────────────
export function renderModuleTitle(slide: PptxGenJS.Slide, pres: PptxGenJS, data: ModuleTitleSlide, colors: PptxColors): void {
  // Module number
  slide.addText(`MODULE ${data.module_number}`, {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 12,
    fontFace: FONTS.BODY,
    color: colors.blue,
    charSpacing: 4,
    align: 'center',
    margin: 0,
  });

  // Module title
  slide.addText(data.module_title, {
    x: 0.5, y: 1.7, w: 9, h: 0.9,
    fontSize: 28,
    fontFace: FONTS.TITLE,
    color: colors.white,
    bold: true,
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  // Decorative line
  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 2.8, w: 3, h: 0,
    line: { color: colors.blue, width: 1 },
  });

  // Topic title
  slide.addText(data.topic_title, {
    x: 1, y: 3.0, w: 8, h: 0.6,
    fontSize: 16,
    fontFace: FONTS.BODY,
    color: colors.gray,
    align: 'center',
    margin: 0,
  });

  addLogo(slide, colors);
  addAccentBar(slide, colors);
}

// ── Outro Slide ──────────────────────────────────────────────────────
export function renderOutro(slide: PptxGenJS.Slide, pres: PptxGenJS, data: OutroSlide, colors: PptxColors): void {
  // Thank you text
  slide.addText('Lesson Complete', {
    x: 0.5, y: 1.5, w: 9, h: 0.8,
    fontSize: 30,
    fontFace: FONTS.TITLE,
    color: colors.white,
    bold: true,
    align: 'center',
    margin: 0,
  });

  // Decorative line
  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 2.5, w: 3, h: 0,
    line: { color: colors.blue, width: 1 },
  });

  // Next lesson teaser
  if (data.next_lesson_title) {
    slide.addText('UP NEXT', {
      x: 1, y: 2.8, w: 8, h: 0.3,
      fontSize: 10,
      fontFace: FONTS.BODY,
      color: colors.blue,
      charSpacing: 3,
      align: 'center',
      margin: 0,
    });
    slide.addText(data.next_lesson_title, {
      x: 1, y: 3.2, w: 8, h: 0.5,
      fontSize: 16,
      fontFace: FONTS.BODY,
      color: colors.gray,
      align: 'center',
      margin: 0,
    });
  }

  addLogo(slide, colors);
  addAccentBar(slide, colors);
}
