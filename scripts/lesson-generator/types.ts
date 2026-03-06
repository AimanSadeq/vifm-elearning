// ── Theme ─────────────────────────────────────────────────────────────
export type ThemeId = 'finance' | 'banking' | 'data' | 'strategy' | 'realestate' | 'certified';

// ── Slide Types ───────────────────────────────────────────────────────
export type SlideType =
  // Core
  | 'intro' | 'module-title' | 'outro'
  // Content (1-8)
  | 'key-points' | 'timeline' | 'comparison' | 'kpi-stats'
  | 'icon-grid' | 'quote' | 'case-study' | 'deep-dive'
  // Text (A-H)
  | 'big-statement' | 'numbered-list' | 'two-column' | 'term-cards'
  | 'do-dont' | 'recap' | 'step-detail' | 'qna'
  // Diagrams (9-16)
  | 'v-timeline' | 'roadmap' | 'circular' | 'funnel'
  | 'pyramid' | 'flowchart' | 'hub-spoke' | 'matrix-2x2';

// ── Base Slide ────────────────────────────────────────────────────────
export interface BaseSlide {
  type: SlideType;
  narration: string;       // Detailed instructor script for ElevenLabs (English)
  narration_ar?: string;   // Arabic narration script
}

// ── Core Slides ───────────────────────────────────────────────────────
export interface IntroSlide extends BaseSlide {
  type: 'intro';
  course_code: string;     // e.g. "CAIFL"
  course_title: string;
  course_title_ar?: string;
  subtitle?: string;
  subtitle_ar?: string;
  lesson_number?: string;  // e.g. "Lesson 01"
}

export interface ModuleTitleSlide extends BaseSlide {
  type: 'module-title';
  module_number: string;   // e.g. "01"
  module_title: string;
  module_title_ar?: string;
  topic_title: string;
  topic_title_ar?: string;
  breadcrumb: string;      // e.g. "CAIFL › Module 01 › AI in Financial Planning"
}

export interface OutroSlide extends BaseSlide {
  type: 'outro';
  next_lesson_title?: string;
  next_lesson_title_ar?: string;
}

// ── Content Slides (1-8) ──────────────────────────────────────────────

// Style 1: Key Points with icon bullets
export interface KeyPointsSlide extends BaseSlide {
  type: 'key-points';
  label?: string;          // e.g. "Core Concepts"
  title: string;
  title_accent?: string;   // highlighted word in title
  points: Array<{
    icon: string;          // emoji
    title: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];      // e.g. [1,1,0,0,0] for 2 of 5 done
}

// Style 2: Timeline / Milestones
export interface TimelineSlide extends BaseSlide {
  type: 'timeline';
  label?: string;
  title: string;
  title_accent?: string;
  events: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Style 3: Comparison (left vs right)
export interface ComparisonSlide extends BaseSlide {
  type: 'comparison';
  label?: string;
  title: string;
  title_accent?: string;
  left_label: string;
  right_label: string;
  rows: Array<{
    aspect: string;
    left: string;
    right: string;
  }>;
  verdict?: string;
  breadcrumb: string;
  progress: number[];
}

// Style 4: KPI Stats (big numbers)
export interface KPIStatsSlide extends BaseSlide {
  type: 'kpi-stats';
  label?: string;
  title: string;
  title_accent?: string;
  stats: Array<{
    value: string;         // e.g. "87%", "$2.4M"
    label: string;
    source?: string;       // data source or "Illustrative"
  }>;
  breadcrumb: string;
  progress: number[];
}

// Style 5: Icon Grid (capabilities / features)
export interface IconGridSlide extends BaseSlide {
  type: 'icon-grid';
  label?: string;
  title: string;
  title_accent?: string;
  items: Array<{
    icon: string;          // emoji
    title: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Style 6: Quote / Expert Insight
export interface QuoteSlide extends BaseSlide {
  type: 'quote';
  quote_text: string;
  attribution: string;
  attribution_role?: string;
  breadcrumb: string;
  progress: number[];
}

// Style 7: Case Study
export interface CaseStudySlide extends BaseSlide {
  type: 'case-study';
  company: string;
  company_accent?: string;
  background: string;
  challenge: string;
  results: Array<{
    value: string;
    description: string;
  }>;
  source?: string;         // "Illustrative" or actual source
  breadcrumb: string;
  progress: number[];
}

// Style 8: Deep Dive (detailed explanation with sub-sections)
export interface DeepDiveSlide extends BaseSlide {
  type: 'deep-dive';
  label?: string;
  title: string;
  title_accent?: string;
  subtitle?: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// ── Text Slides (A-H) ────────────────────────────────────────────────

// Text A: Big Statement (hero text)
export interface BigStatementSlide extends BaseSlide {
  type: 'big-statement';
  label?: string;
  statement: string;
  statement_accent?: string;
  sub_text?: string;
  breadcrumb: string;
  progress: number[];
}

// Text B: Numbered List (full screen)
export interface NumberedListSlide extends BaseSlide {
  type: 'numbered-list';
  label?: string;
  title: string;
  title_accent?: string;
  items: Array<{
    text: string;
    detail?: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Text C: Two-Column Text
export interface TwoColumnSlide extends BaseSlide {
  type: 'two-column';
  label?: string;
  title: string;
  title_accent?: string;
  left_title: string;
  left_items: string[];
  right_title: string;
  right_items: string[];
  breadcrumb: string;
  progress: number[];
}

// Text D: Term + Definition Cards
export interface TermCardsSlide extends BaseSlide {
  type: 'term-cards';
  label?: string;
  title: string;
  title_accent?: string;
  terms: Array<{
    term: string;
    definition: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Text E: Do / Don't
export interface DoDontSlide extends BaseSlide {
  type: 'do-dont';
  label?: string;
  title: string;
  title_accent?: string;
  dos: Array<{ text: string }>;
  donts: Array<{ text: string }>;
  breadcrumb: string;
  progress: number[];
}

// Text F: Summary / Recap
export interface RecapSlide extends BaseSlide {
  type: 'recap';
  title?: string;
  points: Array<{
    icon?: string;
    text: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Text G: Step Detail (process walkthrough)
export interface StepDetailSlide extends BaseSlide {
  type: 'step-detail';
  label?: string;
  title: string;
  title_accent?: string;
  step_number: string;     // "01", "02", etc.
  step_title: string;
  description: string;
  sub_steps?: string[];
  breadcrumb: string;
  progress: number[];
}

// Text H: Question + Answer
export interface QnASlide extends BaseSlide {
  type: 'qna';
  label?: string;
  question: string;
  answer: string;
  breadcrumb: string;
  progress: number[];
}

// ── Diagram Slides (9-16) ─────────────────────────────────────────────

// Diagram 9: Vertical Timeline
export interface VTimelineSlide extends BaseSlide {
  type: 'v-timeline';
  label?: string;
  title: string;
  title_accent?: string;
  events: Array<{
    label: string;         // year or step
    title: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Diagram 10: Roadmap / Gantt Strip
export interface RoadmapSlide extends BaseSlide {
  type: 'roadmap';
  label?: string;
  title: string;
  title_accent?: string;
  phases: Array<{
    phase: string;         // "Phase 1", "Q1", etc.
    title: string;
    items: string[];
  }>;
  breadcrumb: string;
  progress: number[];
}

// Diagram 11: Circular Process
export interface CircularSlide extends BaseSlide {
  type: 'circular';
  label?: string;
  title: string;
  title_accent?: string;
  center_label: string;
  steps: Array<{
    title: string;
    description?: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Diagram 12: Funnel
export interface FunnelSlide extends BaseSlide {
  type: 'funnel';
  label?: string;
  title: string;
  title_accent?: string;
  stages: Array<{
    label: string;
    value?: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Diagram 13: Pyramid / Hierarchy
export interface PyramidSlide extends BaseSlide {
  type: 'pyramid';
  label?: string;
  title: string;
  title_accent?: string;
  levels: Array<{
    label: string;
    description: string;
  }>;                      // top to bottom
  breadcrumb: string;
  progress: number[];
}

// Diagram 14: Flowchart / Decision Tree
export interface FlowchartSlide extends BaseSlide {
  type: 'flowchart';
  label?: string;
  title: string;
  title_accent?: string;
  nodes: Array<{
    id: string;
    label: string;
    type: 'start' | 'decision' | 'process' | 'end';
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// Diagram 15: Hub & Spoke
export interface HubSpokeSlide extends BaseSlide {
  type: 'hub-spoke';
  label?: string;
  title: string;
  title_accent?: string;
  description?: string;
  hub: { title: string; subtitle?: string };
  spokes: Array<{
    title: string;
    subtitle?: string;
  }>;
  detail_points?: string[];
  breadcrumb: string;
  progress: number[];
}

// Diagram 16: 2x2 Matrix
export interface Matrix2x2Slide extends BaseSlide {
  type: 'matrix-2x2';
  label?: string;
  title: string;
  title_accent?: string;
  description?: string;
  x_axis: string;          // e.g. "← Low Effort · High Effort →"
  y_axis: string;          // e.g. "← Low Impact · High Impact →"
  quadrants: Array<{
    label: string;
    items: string[];
    highlight?: boolean;
  }>;                      // [top-left, top-right, bottom-left, bottom-right]
  legend?: Array<{
    color_key: string;
    title: string;
    description: string;
  }>;
  breadcrumb: string;
  progress: number[];
}

// ── Union Type ────────────────────────────────────────────────────────
export type Slide =
  | IntroSlide | ModuleTitleSlide | OutroSlide
  | KeyPointsSlide | TimelineSlide | ComparisonSlide | KPIStatsSlide
  | IconGridSlide | QuoteSlide | CaseStudySlide | DeepDiveSlide
  | BigStatementSlide | NumberedListSlide | TwoColumnSlide | TermCardsSlide
  | DoDontSlide | RecapSlide | StepDetailSlide | QnASlide
  | VTimelineSlide | RoadmapSlide | CircularSlide | FunnelSlide
  | PyramidSlide | FlowchartSlide | HubSpokeSlide | Matrix2x2Slide;

// ── Lesson / Module / Course ──────────────────────────────────────────
export interface LessonContent {
  slug: string;
  title: string;
  title_ar?: string;
  description?: string;
  slides: Slide[];
  duration_minutes?: number; // auto-calculated
}

export interface ModuleContent {
  slug: string;
  title: string;
  title_ar?: string;
  description?: string;
  sort_order: number;
  lessons: LessonContent[];
}

export interface CourseContent {
  slug: string;
  title: string;
  title_ar?: string;
  code: string;            // e.g. "CAIFL"
  description?: string;
  theme: ThemeId;
  modules: ModuleContent[];
}
