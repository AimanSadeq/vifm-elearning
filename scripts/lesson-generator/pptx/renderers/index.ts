import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideType } from '../../types';
import type { PptxColors } from '../theme';
import { SLIDE, MARGIN, FONTS } from '../theme';

// Import all renderers
import { renderIntro, renderModuleTitle, renderOutro } from './core';
import { renderKeyPoints, renderKPIStats, renderIconGrid, renderCaseStudy, renderDeepDive } from './content';
import { renderBigStatement, renderNumberedList, renderTwoColumn, renderTermCards, renderDoDont, renderRecap, renderStepDetail, renderQnA } from './text';
import { renderTimeline, renderComparison, renderQuote } from './visual';
import { renderVTimeline, renderRoadmap, renderCircular, renderFunnel, renderPyramid } from './diagrams';
import { renderFlowchart, renderHubSpoke, renderMatrix2x2 } from './advanced-diagrams';

type SlideRenderer = (slide: PptxGenJS.Slide, pres: PptxGenJS, data: any, colors: PptxColors) => void;

const RENDERERS: Record<SlideType, SlideRenderer> = {
  // Core
  'intro': renderIntro,
  'module-title': renderModuleTitle,
  'outro': renderOutro,
  // Content
  'key-points': renderKeyPoints,
  'kpi-stats': renderKPIStats,
  'icon-grid': renderIconGrid,
  'case-study': renderCaseStudy,
  'deep-dive': renderDeepDive,
  // Text
  'big-statement': renderBigStatement,
  'numbered-list': renderNumberedList,
  'two-column': renderTwoColumn,
  'term-cards': renderTermCards,
  'do-dont': renderDoDont,
  'recap': renderRecap,
  'step-detail': renderStepDetail,
  'qna': renderQnA,
  // Visual
  'timeline': renderTimeline,
  'comparison': renderComparison,
  'quote': renderQuote,
  // Diagrams
  'v-timeline': renderVTimeline,
  'roadmap': renderRoadmap,
  'circular': renderCircular,
  'funnel': renderFunnel,
  'pyramid': renderPyramid,
  // Advanced diagrams
  'flowchart': renderFlowchart,
  'hub-spoke': renderHubSpoke,
  'matrix-2x2': renderMatrix2x2,
};

export function getRenderer(type: SlideType): SlideRenderer | undefined {
  return RENDERERS[type];
}

export interface SlideContext {
  moduleNum: number;
  lessonNum: number;
}

export function renderSlide(
  pres: PptxGenJS,
  slideData: Slide,
  colors: PptxColors,
  masterName: string,
  slideNum?: number,
  slideTotal?: number,
  audioPath?: string,
  context?: SlideContext
): PptxGenJS.Slide {
  const slide = pres.addSlide({ masterName });
  const renderer = getRenderer(slideData.type);

  if (renderer) {
    renderer(slide, pres, slideData, colors);
  } else {
    // Fallback: just show the slide type
    slide.addText(`[${slideData.type}]`, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 24, color: colors.gray, align: 'center', valign: 'middle',
    });
  }

  // Add narration as speaker notes
  if (slideData.narration) {
    slide.addNotes(slideData.narration);
  }

  // Embed audio narration (positioned off-screen so play icon is hidden)
  if (audioPath) {
    slide.addMedia({
      type: 'audio',
      path: audioPath,
      x: SLIDE.W + 1,
      y: SLIDE.H + 1,
      w: 0.01,
      h: 0.01,
    } as any);
  }

  // Module & lesson reference (bottom-center, all slides)
  if (context) {
    const ref = `Module ${String(context.moduleNum).padStart(2, '0')}  ·  Lesson ${String(context.lessonNum).padStart(2, '0')}`;
    slide.addText(ref, {
      x: SLIDE.W / 2 - 1.5,
      y: SLIDE.H - MARGIN.BOTTOM - 0.05,
      w: 3,
      h: 0.25,
      fontSize: 7,
      fontFace: FONTS.BODY,
      color: colors.gray,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  }

  // Page number (bottom-right)
  if (slideNum !== undefined && slideTotal !== undefined) {
    slide.addText(`${slideNum} / ${slideTotal}`, {
      x: SLIDE.W - MARGIN.RIGHT - 0.8,
      y: SLIDE.H - MARGIN.BOTTOM - 0.05,
      w: 0.8,
      h: 0.25,
      fontSize: 8,
      fontFace: FONTS.BODY,
      color: colors.gray,
      align: 'right',
      valign: 'middle',
      margin: 0,
    });
  }

  return slide;
}
