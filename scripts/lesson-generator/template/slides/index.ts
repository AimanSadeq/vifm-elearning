import type { Slide } from '../../types';

import { renderIntro } from './intro';
import { renderModuleTitle } from './module-title';
import { renderOutro } from './outro';
import { renderKeyPoints } from './key-points';
import { renderTimeline } from './timeline';
import { renderComparison } from './comparison';
import { renderKPIStats } from './kpi-stats';
import { renderIconGrid } from './icon-grid';
import { renderQuote } from './quote';
import { renderCaseStudy } from './case-study';
import { renderDeepDive } from './deep-dive';
import { renderBigStatement } from './big-statement';
import { renderNumberedList } from './numbered-list';
import { renderTwoColumn } from './two-column';
import { renderTermCards } from './term-cards';
import { renderDoDont } from './do-dont';
import { renderRecap } from './recap';
import { renderStepDetail } from './step-detail';
import { renderQnA } from './qna';
import { renderVTimeline } from './v-timeline';
import { renderRoadmap } from './roadmap';
import { renderCircular } from './circular';
import { renderFunnel } from './funnel';
import { renderPyramid } from './pyramid';
import { renderFlowchart } from './flowchart';
import { renderHubSpoke } from './hub-spoke';
import { renderMatrix2x2 } from './matrix-2x2';

const renderers: Record<string, (data: any) => string> = {
  'intro': renderIntro,
  'module-title': renderModuleTitle,
  'outro': renderOutro,
  'key-points': renderKeyPoints,
  'timeline': renderTimeline,
  'comparison': renderComparison,
  'kpi-stats': renderKPIStats,
  'icon-grid': renderIconGrid,
  'quote': renderQuote,
  'case-study': renderCaseStudy,
  'deep-dive': renderDeepDive,
  'big-statement': renderBigStatement,
  'numbered-list': renderNumberedList,
  'two-column': renderTwoColumn,
  'term-cards': renderTermCards,
  'do-dont': renderDoDont,
  'recap': renderRecap,
  'step-detail': renderStepDetail,
  'qna': renderQnA,
  'v-timeline': renderVTimeline,
  'roadmap': renderRoadmap,
  'circular': renderCircular,
  'funnel': renderFunnel,
  'pyramid': renderPyramid,
  'flowchart': renderFlowchart,
  'hub-spoke': renderHubSpoke,
  'matrix-2x2': renderMatrix2x2,
};

export function renderSlide(slide: Slide): string {
  const renderer = renderers[slide.type];
  if (!renderer) throw new Error(`Unknown slide type: ${slide.type}`);
  return renderer(slide);
}
