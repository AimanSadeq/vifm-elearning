/* ------------------------------------------------------------------ */
/*  Course Content Data — Static registry keyed by designation slug    */
/* ------------------------------------------------------------------ */

export interface BilingualText {
  en: string;
  ar: string;
}

export interface CourseVideo {
  num: string;
  title: BilingualText;
  desc: BilingualText;
  duration: string;
}

export interface CourseModule {
  id: number;
  title: BilingualText;
  videos: CourseVideo[];
}

export interface CourseObjective {
  title: BilingualText;
  desc: BilingualText;
}

export interface CourseCompetency {
  text: BilingualText;
}

export interface CourseContentData {
  objectivesTitle: BilingualText;
  objectivesIntro: BilingualText;
  objectives: CourseObjective[];
  audienceTitle: BilingualText;
  audienceDesc: BilingualText;
  competenciesTitle: BilingualText;
  competencies: CourseCompetency[];
  contentTitle: BilingualText;
  contentSubtitle: BilingualText;
  prerequisiteNote?: BilingualText;
  modules: CourseModule[];
}

export type CourseContentRegistry = Record<string, CourseContentData>;

/* ------------------------------------------------------------------ */
/*  CDIP — Certified Data Intelligence Professional                    */
/* ------------------------------------------------------------------ */

export const courseContentRegistry: CourseContentRegistry = {
  cdip: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "\u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u062F\u0648\u0631\u0629",
    },
    objectivesIntro: {
      en: "By completing this course, participants will be able to:",
      ar: "\u0628\u0639\u062F \u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u062F\u0648\u0631\u0629\u060C \u0633\u064A\u062A\u0645\u0643\u0646 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0648\u0646 \u0645\u0646:",
    },
    objectives: [
      {
        title: {
          en: "Master PivotTables",
          ar: "\u0625\u062A\u0642\u0627\u0646 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A",
        },
        desc: {
          en: "Prepare enhanced reporting models covering three building blocks: Design, Analyze, and Report.",
          ar: "\u0625\u0639\u062F\u0627\u062F \u0646\u0645\u0627\u0630\u062C \u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u062A\u0642\u062F\u0645\u0629 \u062A\u063A\u0637\u064A \u0627\u0644\u0631\u0643\u0627\u0626\u0632 \u0627\u0644\u062B\u0644\u0627\u062B: \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631.",
        },
      },
      {
        title: {
          en: "PowerPivot & Data Models",
          ar: "\u0628\u0627\u0648\u0631 \u0628\u064A\u0641\u0648\u062A \u0648\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
        },
        desc: {
          en: "Work with Data Models, Measures, Relationships, Multiple Sources, and DAX expressions.",
          ar: "\u0627\u0644\u0639\u0645\u0644 \u0645\u0639 \u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0642\u0627\u064A\u064A\u0633 \u0648\u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0645\u062A\u0639\u062F\u062F\u0629 \u0648\u062A\u0639\u0628\u064A\u0631\u0627\u062A DAX.",
        },
      },
      {
        title: {
          en: "Power Query ETL",
          ar: "\u0628\u0627\u0648\u0631 \u0643\u0648\u064A\u0631\u064A \u0644\u0644\u0640 ETL",
        },
        desc: {
          en: "Transform data from different sources and design measures using one of the most important data tools.",
          ar: "\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 \u0645\u0635\u0627\u062F\u0631 \u0645\u062E\u062A\u0644\u0641\u0629 \u0648\u062A\u0635\u0645\u064A\u0645 \u0645\u0642\u0627\u064A\u064A\u0633 \u0645\u062A\u0646\u0648\u0639\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u062D\u062F \u0623\u0647\u0645 \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.",
        },
      },
      {
        title: {
          en: "Power BI Dashboards",
          ar: "\u0644\u0648\u062D\u0627\u062A \u0628\u0627\u0648\u0631 \u0628\u064A \u0622\u064A",
        },
        desc: {
          en: "Plan, design, and produce industry-standard Reports and Dashboards using Power BI.",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0648\u062A\u0635\u0645\u064A\u0645 \u0648\u0625\u0646\u062A\u0627\u062C \u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0644\u0648\u062D\u0627\u062A \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0628\u0645\u0639\u0627\u064A\u064A\u0631 \u0645\u0647\u0646\u064A\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0627\u0648\u0631 \u0628\u064A \u0622\u064A.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629",
    },
    audienceDesc: {
      en: "This course is designed for data professionals and business intelligence professionals who want to learn how to accurately perform data analysis using Power BI. It is also targeted toward individuals who develop reports that visualize data from data platform technologies that exist both in the cloud and on-premises.",
      ar: "\u0635\u064F\u0645\u0651\u0645\u062A \u0647\u0630\u0647 \u0627\u0644\u062F\u0648\u0631\u0629 \u0644\u0645\u062D\u062A\u0631\u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0645\u062A\u062E\u0635\u0635\u064A \u0630\u0643\u0627\u0621 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0631\u0627\u063A\u0628\u064A\u0646 \u0641\u064A \u062A\u0639\u0644\u0645 \u0643\u064A\u0641\u064A\u0629 \u0625\u062C\u0631\u0627\u0621 \u062A\u062D\u0644\u064A\u0644 \u062F\u0642\u064A\u0642 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0627\u0648\u0631 \u0628\u064A \u0622\u064A. \u0643\u0645\u0627 \u062A\u0633\u062A\u0647\u062F\u0641 \u0627\u0644\u0623\u0641\u0631\u0627\u062F \u0627\u0644\u0630\u064A\u0646 \u064A\u0637\u0648\u0631\u0648\u0646 \u062A\u0642\u0627\u0631\u064A\u0631 \u0644\u062A\u0635\u0648\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 \u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062E\u062A\u0644\u0641\u0629 \u0633\u0648\u0627\u0621 \u0641\u064A \u0627\u0644\u0633\u062D\u0627\u0628\u0629 \u0623\u0648 \u0641\u064A \u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "\u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629",
    },
    competencies: [
      { text: { en: "19 Rules of Pivot Tables", ar: "\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0640 19 \u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A" } },
      { text: { en: "3 Building Blocks of Pivot Tables", ar: "\u0627\u0644\u0631\u0643\u0627\u0626\u0632 \u0627\u0644\u0640 3 \u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A" } },
      { text: { en: "ETL Using Power Query", ar: "ETL \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0627\u0648\u0631 \u0643\u0648\u064A\u0631\u064A" } },
      { text: { en: "Superior Reports & Analysis", ar: "\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0645\u062A\u0642\u062F\u0645\u0629" } },
      { text: { en: "Data Visualization", ar: "\u062A\u0635\u0648\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" } },
      { text: { en: "Power BI", ar: "\u0628\u0627\u0648\u0631 \u0628\u064A \u0622\u064A" } },
      { text: { en: "Data Analysis", ar: "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" } },
      { text: { en: "Deploy & Maintain Deliverables", ar: "\u0646\u0634\u0631 \u0648\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0648\u0631\u0629",
    },
    contentSubtitle: {
      en: "4 Modules \u2022 30 Video Lessons \u2022 5 Days of Hands-On Training",
      ar: "4 \u0648\u062D\u062F\u0627\u062A \u2022 30 \u062F\u0631\u0633 \u0641\u064A\u062F\u064A\u0648 \u2022 5 \u0623\u064A\u0627\u0645 \u062A\u062F\u0631\u064A\u0628 \u0639\u0645\u0644\u064A",
    },
    prerequisiteNote: {
      en: "This course requires a laptop with Microsoft Excel 2019/365 and Microsoft Power BI Desktop installed.",
      ar: "\u064A\u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u062C\u0647\u0627\u0632 \u062D\u0627\u0633\u0648\u0628 \u0645\u062D\u0645\u0648\u0644 \u0645\u0639 Microsoft Excel 2019/365 \u0648Microsoft Power BI Desktop.",
    },
    modules: [
      {
        id: 1,
        title: { en: "Pivot Tables: Tools & Techniques", ar: "\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A: \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A" },
        videos: [
          { num: "1.1", title: { en: "The 19 Rules of Pivot Tables", ar: "\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0633\u0639\u0629 \u0639\u0634\u0631 \u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A" }, desc: { en: "Comprehensive overview of the 19 foundational rules that govern effective PivotTable creation and management.", ar: "\u0646\u0638\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0623\u0633\u064A\u0633\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u062D\u0643\u0645 \u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u062F\u0627\u0631\u0629 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0628\u0641\u0639\u0627\u0644\u064A\u0629." }, duration: "25 min" },
          { num: "1.2", title: { en: "Designing Pivot Tables & Number Formatting", ar: "\u062A\u0635\u0645\u064A\u0645 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0623\u0631\u0642\u0627\u0645" }, desc: { en: "Learn design rules for building PivotTables and apply professional number formatting techniques.", ar: "\u062A\u0639\u0644\u0651\u0645 \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0644\u0628\u0646\u0627\u0621 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0648\u062A\u0637\u0628\u064A\u0642 \u062A\u0642\u0646\u064A\u0627\u062A \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629." }, duration: "20 min" },
          { num: "1.3", title: { en: "Report Layout & Sorting Techniques", ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0641\u0631\u0632" }, desc: { en: "Design report layouts and master sorting in ascending, descending, and custom sort orders.", ar: "\u062A\u0635\u0645\u064A\u0645 \u062A\u062E\u0637\u064A\u0637\u0627\u062A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0625\u062A\u0642\u0627\u0646 \u0627\u0644\u0641\u0631\u0632 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B \u0648\u062A\u0646\u0627\u0632\u0644\u064A\u0627\u064B \u0648\u0628\u062E\u064A\u0627\u0631\u0627\u062A \u0645\u062E\u0635\u0635\u0629." }, duration: "20 min" },
          { num: "1.4", title: { en: "Filtering & Report Navigation", ar: "\u0627\u0644\u062A\u0635\u0641\u064A\u0629 \u0648\u0627\u0644\u062A\u0646\u0642\u0644 \u0641\u064A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631" }, desc: { en: "Filter labels and values, expand and collapse reports for efficient data navigation.", ar: "\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u062A\u0633\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u0642\u064A\u0645 \u0648\u062A\u0648\u0633\u064A\u0639 \u0648\u0637\u064A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0644\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0641\u0639\u0651\u0627\u0644 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }, duration: "20 min" },
          { num: "1.5", title: { en: "Summarizing Values & Percentage Analysis", ar: "\u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0642\u064A\u0645 \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0646\u0633\u0628 \u0627\u0644\u0645\u0626\u0648\u064A\u0629" }, desc: { en: "Summarize by sum, average, min, max, count. Show values as percentage of total and percentage of columns.", ar: "\u0627\u0644\u062A\u0644\u062E\u064A\u0635 \u0628\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0648\u0627\u0644\u0645\u062A\u0648\u0633\u0637 \u0648\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0648\u0627\u0644\u0623\u0642\u0635\u0649 \u0648\u0627\u0644\u0639\u062F. \u0639\u0631\u0636 \u0627\u0644\u0642\u064A\u0645 \u0643\u0646\u0633\u0628\u0629 \u0645\u0626\u0648\u064A\u0629." }, duration: "25 min" },
          { num: "1.6", title: { en: "Options, Formulas & Date Analysis", ar: "\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u063A \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0648\u0627\u0631\u064A\u062E" }, desc: { en: "Configure PivotTable options, insert formulas, perform date analysis, and copy PivotTables.", ar: "\u0636\u0628\u0637 \u062E\u064A\u0627\u0631\u0627\u062A \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0648\u0625\u062F\u0631\u0627\u062C \u0627\u0644\u0635\u064A\u063A \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0648\u0627\u0631\u064A\u062E \u0648\u0646\u0633\u062E \u0627\u0644\u062C\u062F\u0627\u0648\u0644." }, duration: "25 min" },
          { num: "1.7", title: { en: "Pivot Charts & Dynamic Labeling", ar: "\u0645\u062E\u0637\u0637\u0627\u062A \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0648\u0627\u0644\u062A\u0633\u0645\u064A\u0627\u062A \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629" }, desc: { en: "Create pivot charts, apply dynamic chart labeling, and master the slicer for interactive reporting.", ar: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062E\u0637\u0637\u0627\u062A \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0648\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0633\u0645\u064A\u0627\u062A \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629 \u0648\u0625\u062A\u0642\u0627\u0646 \u0623\u062F\u0627\u0629 \u0627\u0644\u062A\u0642\u0637\u064A\u0639." }, duration: "25 min" },
          { num: "1.8", title: { en: "Conditional Formatting & GetPivotData", ar: "\u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0634\u0631\u0637\u064A \u0648\u062F\u0627\u0644\u0629 GetPivotData" }, desc: { en: "Apply conditional formatting, link PivotTables with PowerPoint, and extract data using GetPivotData.", ar: "\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0634\u0631\u0637\u064A \u0648\u0631\u0628\u0637 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A \u0628\u0628\u0648\u0631\u0628\u0648\u064A\u0646\u062A \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }, duration: "25 min" },
          { num: "1.9", title: { en: "Performance KPIs & Managing PivotTables", ar: "\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0625\u062F\u0627\u0631\u0629 \u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0628\u064A\u0641\u0648\u062A" }, desc: { en: "Create performance KPIs with actual vs. target values. Format, filter, group, and summarize PivotTable data.", ar: "\u0625\u0646\u0634\u0627\u0621 \u0645\u0624\u0634\u0631\u0627\u062A \u0623\u062F\u0627\u0621 \u0628\u0642\u064A\u0645 \u0641\u0639\u0644\u064A\u0629 \u0645\u0642\u0627\u0628\u0644 \u0645\u0633\u062A\u0647\u062F\u0641\u0629. \u062A\u0646\u0633\u064A\u0642 \u0648\u062A\u0635\u0641\u064A\u0629 \u0648\u062A\u062C\u0645\u064A\u0639 \u0648\u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Power Pivot", ar: "\u0628\u0627\u0648\u0631 \u0628\u064A\u0641\u0648\u062A" },
        videos: [
          { num: "2.1", title: { en: "Importing from Data Sources", ar: "\u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0645\u0646 \u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Connect to and import from databases, files, folders, and various external data sources.", ar: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0644\u062F\u0627\u062A \u0648\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u0627\u0644\u0645\u062E\u062A\u0644\u0641\u0629." }, duration: "25 min" },
          { num: "2.2", title: { en: "Connecting to SQL, Access & Excel", ar: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 SQL \u0648Access \u0648Excel" }, desc: { en: "Establish connections to Microsoft SQL Server, Access databases, Excel files, and HTML sources.", ar: "\u0625\u0646\u0634\u0627\u0621 \u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0628\u062E\u0627\u062F\u0645 SQL \u0648\u0642\u0648\u0627\u0639\u062F \u0628\u064A\u0627\u0646\u0627\u062A Access \u0648\u0645\u0644\u0641\u0627\u062A Excel \u0648\u0645\u0635\u0627\u062F\u0631 HTML." }, duration: "25 min" },
          { num: "2.3", title: { en: "Creating & Optimizing Data Models", ar: "\u0625\u0646\u0634\u0627\u0621 \u0648\u062A\u062D\u0633\u064A\u0646 \u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Manage data relationships, optimize models for reporting, and manually enter data into models.", ar: "\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0627\u0642\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u064A\u062F\u0648\u064A\u0627\u064B." }, duration: "30 min" },
          { num: "2.4", title: { en: "Managing Data Relationships", ar: "\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0627\u0642\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Perform Get & Transform operations and create both automatic and manual relationships between tables.", ar: "\u062A\u0646\u0641\u064A\u0630 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0648\u0625\u0646\u0634\u0627\u0621 \u0639\u0644\u0627\u0642\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0648\u064A\u062F\u0648\u064A\u0629 \u0628\u064A\u0646 \u0627\u0644\u062C\u062F\u0627\u0648\u0644." }, duration: "25 min" },
          { num: "2.5", title: { en: "DAX Queries & Formulas", ar: "\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u0635\u064A\u063A DAX" }, desc: { en: "Create DAX queries and formulas to build powerful calculated columns and measures.", ar: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u0635\u064A\u063A DAX \u0644\u0628\u0646\u0627\u0621 \u0623\u0639\u0645\u062F\u0629 \u0648\u0645\u0642\u0627\u064A\u064A\u0633 \u0645\u062D\u0633\u0648\u0628\u0629 \u0642\u0648\u064A\u0629." }, duration: "30 min" },
          { num: "2.6", title: { en: "Calculated Columns, Measures & Tables", ar: "\u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u064A\u064A\u0633 \u0648\u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0645\u062D\u0633\u0648\u0628\u0629" }, desc: { en: "Build calculated columns, measures, and tables using DAX and Excel formulas for advanced analytics.", ar: "\u0628\u0646\u0627\u0621 \u0623\u0639\u0645\u062F\u0629 \u0648\u0645\u0642\u0627\u064A\u064A\u0633 \u0648\u062C\u062F\u0627\u0648\u0644 \u0645\u062D\u0633\u0648\u0628\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0635\u064A\u063A DAX \u0648Excel \u0644\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Power Query", ar: "\u0628\u0627\u0648\u0631 \u0643\u0648\u064A\u0631\u064A" },
        videos: [
          { num: "3.1", title: { en: "Connecting to Data Sources", ar: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Identify and connect to data sources, change settings, and select shared or local datasets.", ar: "\u062A\u062D\u062F\u064A\u062F \u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0647\u0627 \u0648\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }, duration: "25 min" },
          { num: "3.2", title: { en: "Query Types, Performance & Parameters", ar: "\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u0627\u062A" }, desc: { en: "Choose appropriate query types, identify performance issues, use CDS and parameters effectively.", ar: "\u0627\u062E\u062A\u064A\u0627\u0631 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0648\u062A\u062D\u062F\u064A\u062F \u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0633\u062A\u062E\u062F\u0627\u0645 CDS \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u0627\u062A." }, duration: "25 min" },
          { num: "3.3", title: { en: "Cleaning & Resolving Data Quality Issues", ar: "\u062A\u0646\u0638\u064A\u0641 \u0648\u062D\u0644 \u0645\u0634\u0627\u0643\u0644 \u062C\u0648\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Resolve inconsistencies, null values, and quality issues. Apply user-friendly value replacements.", ar: "\u062D\u0644 \u0627\u0644\u062A\u0646\u0627\u0642\u0636\u0627\u062A \u0648\u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0641\u0627\u0631\u063A\u0629 \u0648\u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u062C\u0648\u062F\u0629. \u062A\u0637\u0628\u064A\u0642 \u0627\u0633\u062A\u0628\u062F\u0627\u0644\u0627\u062A \u0642\u064A\u0645 \u0633\u0647\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645." }, duration: "25 min" },
          { num: "3.4", title: { en: "Transforming Data Types & Shapes", ar: "\u062A\u062D\u0648\u064A\u0644 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644" }, desc: { en: "Evaluate and transform column data types, apply shape transformations to table structures, and create join keys.", ar: "\u062A\u0642\u064A\u064A\u0645 \u0648\u062A\u062D\u0648\u064A\u0644 \u0623\u0646\u0648\u0627\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u062A\u0637\u0628\u064A\u0642 \u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0627\u0644\u0634\u0643\u0644 \u0648\u0625\u0646\u0634\u0627\u0621 \u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u0631\u0628\u0637." }, duration: "25 min" },
          { num: "3.5", title: { en: "Combining Queries & Naming Conventions", ar: "\u062F\u0645\u062C \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u0627\u0635\u0637\u0644\u0627\u062D\u0627\u062A \u0627\u0644\u062A\u0633\u0645\u064A\u0629" }, desc: { en: "Combine queries, apply naming conventions to columns and queries for organized data models.", ar: "\u062F\u0645\u062C \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0648\u062A\u0637\u0628\u064A\u0642 \u0627\u0635\u0637\u0644\u0627\u062D\u0627\u062A \u0627\u0644\u062A\u0633\u0645\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645\u0627\u062A \u0644\u0646\u0645\u0627\u0630\u062C \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646\u0638\u0645\u0629." }, duration: "20 min" },
          { num: "3.6", title: { en: "Power Query M Code & Data Loading", ar: "\u0644\u063A\u0629 M \u0641\u064A \u0628\u0627\u0648\u0631 \u0643\u0648\u064A\u0631\u064A \u0648\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }, desc: { en: "Leverage the Advanced Editor to modify Power Query M code, configure data loading, and resolve import errors.", ar: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u062D\u0631\u0631 \u0627\u0644\u0645\u062A\u0642\u062F\u0645 \u0644\u062A\u0639\u062F\u064A\u0644 \u0643\u0648\u062F M \u0648\u0636\u0628\u0637 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062D\u0644 \u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F." }, duration: "30 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Power BI", ar: "\u0628\u0627\u0648\u0631 \u0628\u064A \u0622\u064A" },
        videos: [
          { num: "4.1", title: { en: "Adding & Configuring Visualizations", ar: "\u0625\u0636\u0627\u0641\u0629 \u0648\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u062A\u0635\u0648\u0631\u0627\u062A \u0627\u0644\u0628\u0635\u0631\u064A\u0629" }, desc: { en: "Add visualization items to reports, choose appropriate types, and format and configure visualizations.", ar: "\u0625\u0636\u0627\u0641\u0629 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u062A\u0635\u0648\u0631 \u0625\u0644\u0649 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0648\u062A\u0646\u0633\u064A\u0642\u0647\u0627 \u0648\u062A\u0647\u064A\u0626\u062A\u0647\u0627." }, duration: "25 min" },
          { num: "4.2", title: { en: "Custom Visuals & Conditional Formatting", ar: "\u0627\u0644\u062A\u0635\u0648\u0631\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0634\u0631\u0637\u064A" }, desc: { en: "Import custom visuals from the marketplace and apply conditional formatting to enhance reports.", ar: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u062A\u0635\u0648\u0631\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0645\u0646 \u0627\u0644\u0633\u0648\u0642 \u0648\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0634\u0631\u0637\u064A \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631." }, duration: "25 min" },
          { num: "4.3", title: { en: "Slicing, Filtering & Advanced Visuals", ar: "\u0627\u0644\u062A\u0642\u0637\u064A\u0639 \u0648\u0627\u0644\u062A\u0635\u0641\u064A\u0629 \u0648\u0627\u0644\u062A\u0635\u0648\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629" }, desc: { en: "Apply slicing and filtering techniques. Add R or Python visuals for advanced analytical capabilities.", ar: "\u062A\u0637\u0628\u064A\u0642 \u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u062A\u0642\u0637\u064A\u0639 \u0648\u0627\u0644\u062A\u0635\u0641\u064A\u0629. \u0625\u0636\u0627\u0641\u0629 \u062A\u0635\u0648\u0631\u0627\u062A R \u0623\u0648 Python \u0644\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629." }, duration: "25 min" },
          { num: "4.4", title: { en: "Report Configuration & Accessibility", ar: "\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644" }, desc: { en: "Configure report pages, design for accessibility, and set up automatic page refresh.", ar: "\u062A\u0647\u064A\u0626\u0629 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0644\u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u0635\u0641\u062D\u0627\u062A." }, duration: "25 min" },
          { num: "4.5", title: { en: "Creating & Managing Dashboards", ar: "\u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u062F\u0627\u0631\u0629 \u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A" }, desc: { en: "Set mobile views, manage tiles, configure data alerts, and use the Q&A feature on dashboards.", ar: "\u0625\u0639\u062F\u0627\u062F \u0639\u0631\u0636 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0628\u0644\u0627\u0637\u0627\u062A \u0648\u062A\u0647\u064A\u0626\u0629 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u064A\u0632\u0629 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0627\u0644\u0623\u062C\u0648\u0628\u0629." }, duration: "30 min" },
          { num: "4.6", title: { en: "Dashboard Themes & Live Reports", ar: "\u0633\u0645\u0627\u062A \u0627\u0644\u0644\u0648\u062D\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629" }, desc: { en: "Add dashboard themes, pin live report pages, and configure data classification for governance.", ar: "\u0625\u0636\u0627\u0641\u0629 \u0633\u0645\u0627\u062A \u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u062A\u062B\u0628\u064A\u062A \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u062A\u0647\u064A\u0626\u0629 \u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A." }, duration: "20 min" },
          { num: "4.7", title: { en: "Bookmarks, Tooltips & Interactions", ar: "\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 \u0648\u062A\u0644\u0645\u064A\u062D\u0627\u062A \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A" }, desc: { en: "Configure bookmarks, create custom tooltips, edit interactions between visuals, and set up report navigation.", ar: "\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629 \u0648\u0625\u0646\u0634\u0627\u0621 \u062A\u0644\u0645\u064A\u062D\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0646\u0642\u0644 \u0641\u064A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631." }, duration: "25 min" },
          { num: "4.8", title: { en: "Drill Through, Cross Filter & Drilldown", ar: "\u0627\u0644\u062A\u0646\u0642\u064A\u0628 \u0648\u0627\u0644\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u0645\u062A\u0642\u0627\u0637\u0639\u0629 \u0648\u0627\u0644\u062A\u0639\u0645\u0642" }, desc: { en: "Use drill through and cross filter, drilldown into data using interactive visuals, and export report data.", ar: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062A\u0646\u0642\u064A\u0628 \u0648\u0627\u0644\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u0645\u062A\u0642\u0627\u0637\u0639\u0629 \u0648\u0627\u0644\u062A\u0639\u0645\u0642 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062A\u0635\u062F\u064A\u0631 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631." }, duration: "30 min" },
          { num: "4.9", title: { en: "Analytics Tools & Exposing Insights", ar: "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0643\u0634\u0641 \u0627\u0644\u0631\u0624\u0649" }, desc: { en: "Perform Top N analysis, explore statistical summaries, use Q&A visual, Quick Insights, reference lines, and Play Axis.", ar: "\u0625\u062C\u0631\u0627\u0621 \u062A\u062D\u0644\u064A\u0644 \u0623\u0639\u0644\u0649 N \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u0644\u062E\u0635\u0627\u062A \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0648\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0631\u0626\u064A \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0627\u0644\u0631\u0624\u0649 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u062E\u0637\u0648\u0637 \u0627\u0644\u0645\u0631\u062C\u0639 \u0648\u0645\u062D\u0648\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CAIFL — Certified AI Finance Leader                                */
  /* ------------------------------------------------------------------ */

  caifl: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By completing this course, participants will be able to:",
      ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "AI-Powered Financial Planning",
          ar: "التخطيط المالي بالذكاء الاصطناعي",
        },
        desc: {
          en: "Apply AI to automate financial planning, budgeting, and forecasting using scenario-based models and predictive cash flow management.",
          ar: "تطبيق الذكاء الاصطناعي لأتمتة التخطيط المالي والميزانية والتنبؤ باستخدام النماذج القائمة على السيناريوهات وإدارة التدفقات النقدية التنبؤية.",
        },
      },
      {
        title: {
          en: "Descriptive & Predictive Analytics",
          ar: "التحليلات الوصفية والتنبؤية",
        },
        desc: {
          en: "Utilize descriptive and predictive analytics to evaluate financial performance, build KPI models, and integrate insights into dashboards.",
          ar: "استخدام التحليلات الوصفية والتنبؤية لتقييم الأداء المالي وبناء نماذج مؤشرات الأداء ودمج الرؤى في لوحات المعلومات.",
        },
      },
      {
        title: {
          en: "AI-Driven Risk Management",
          ar: "إدارة المخاطر بالذكاء الاصطناعي",
        },
        desc: {
          en: "Implement AI-based risk modeling, fraud detection, anomaly identification, and compliance monitoring with scenario analysis and stress testing.",
          ar: "تنفيذ نمذجة المخاطر القائمة على الذكاء الاصطناعي واكتشاف الاحتيال وتحديد الشذوذ ومراقبة الامتثال مع تحليل السيناريوهات واختبارات الإجهاد.",
        },
      },
      {
        title: {
          en: "Corporate Valuation & Investment",
          ar: "التقييم المؤسسي والاستثمار",
        },
        desc: {
          en: "Perform corporate valuation and investment analysis using AI-enhanced models including DCF, comparables, M&A analysis, and capital allocation.",
          ar: "إجراء التقييم المؤسسي وتحليل الاستثمار باستخدام النماذج المعززة بالذكاء الاصطناعي بما في ذلك التدفقات النقدية المخصومة والمقارنات وتحليل الاندماج والاستحواذ وتخصيص رأس المال.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "CFOs, financial controllers, budgeting specialists, investment analysts, valuation professionals, and finance managers seeking AI-driven strategies to improve decision-making and strategic planning capabilities.",
      ar: "المدراء الماليون والمراقبون الماليون ومتخصصو الميزانية ومحللو الاستثمار ومتخصصو التقييم ومدراء التمويل الذين يسعون إلى استراتيجيات مدعومة بالذكاء الاصطناعي لتحسين قدرات اتخاذ القرار والتخطيط الاستراتيجي.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Financial Forecasting", ar: "التنبؤ المالي" } },
      { text: { en: "Budget Optimization", ar: "تحسين الميزانية" } },
      { text: { en: "Predictive Analytics", ar: "التحليلات التنبؤية" } },
      { text: { en: "Data Interpretation", ar: "تفسير البيانات" } },
      { text: { en: "Risk Modeling", ar: "نمذجة المخاطر" } },
      { text: { en: "Fraud Detection", ar: "اكتشاف الاحتيال" } },
      { text: { en: "Investment Analysis", ar: "تحليل الاستثمار" } },
      { text: { en: "Valuation Techniques", ar: "تقنيات التقييم" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "5 Modules \u2022 18 Video Lessons \u2022 5 Days of Hands-On Training",
      ar: "5 وحدات \u2022 18 درس فيديو \u2022 5 أيام تدريب عملي",
    },
    modules: [
      {
        id: 1,
        title: { en: "AI in Financial Planning, Budgeting & Forecasting", ar: "الذكاء الاصطناعي في التخطيط المالي والميزانية والتنبؤ" },
        videos: [
          { num: "1.1", title: { en: "Overview of AI in Financial Planning", ar: "نظرة عامة على الذكاء الاصطناعي في التخطيط المالي" }, desc: { en: "A comprehensive introduction to how AI is reshaping financial planning, from automated forecasting to intelligent budget optimization.", ar: "مقدمة شاملة حول كيفية إعادة تشكيل الذكاء الاصطناعي للتخطيط المالي، من التنبؤ الآلي إلى تحسين الميزانية الذكي." }, duration: "30 min" },
          { num: "1.2", title: { en: "Automating Forecasting & Budgeting", ar: "أتمتة التنبؤ والميزانية" }, desc: { en: "Learn how AI automates the end-to-end forecasting and budgeting process, from data integration to automated variance analysis.", ar: "تعلم كيف يعمل الذكاء الاصطناعي على أتمتة عملية التنبؤ والميزانية من البداية إلى النهاية، من تكامل البيانات إلى تحليل الانحراف الآلي." }, duration: "30 min" },
          { num: "1.3", title: { en: "Scenario-Based Planning Using AI Models", ar: "التخطيط القائم على السيناريوهات باستخدام نماذج الذكاء الاصطناعي" }, desc: { en: "Explore how AI enables sophisticated scenario planning through Monte Carlo simulations and automated sensitivity analysis.", ar: "استكشاف كيف يمكّن الذكاء الاصطناعي التخطيط المتقدم للسيناريوهات من خلال محاكاة مونت كارلو وتحليل الحساسية الآلي." }, duration: "30 min" },
          { num: "1.4", title: { en: "Predictive Cash Flow Management", ar: "إدارة التدفق النقدي التنبؤية" }, desc: { en: "Master AI-driven approaches to cash flow prediction, from building maturity models to managing seasonal patterns and anomalies.", ar: "إتقان أساليب التنبؤ بالتدفق النقدي المدعومة بالذكاء الاصطناعي، من بناء نماذج النضج إلى إدارة الأنماط الموسمية والشذوذ." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Descriptive & Predictive Analytics for Finance", ar: "التحليلات الوصفية والتنبؤية للتمويل" },
        videos: [
          { num: "2.1", title: { en: "Data Visualization & AI-Powered Reporting", ar: "تصور البيانات والتقارير المدعومة بالذكاء الاصطناعي" }, desc: { en: "Explore the importance of data visualization in finance and learn how AI-powered reporting tools transform raw data into actionable insights.", ar: "استكشاف أهمية تصور البيانات في التمويل وتعلم كيف تحوّل أدوات التقارير المدعومة بالذكاء الاصطناعي البيانات الخام إلى رؤى قابلة للتنفيذ." }, duration: "30 min" },
          { num: "2.2", title: { en: "Descriptive Analytics for Historical Performance", ar: "التحليلات الوصفية للأداء التاريخي" }, desc: { en: "Understand the foundations of descriptive analytics, master techniques including variance analysis, trend analysis, and financial ratio analysis.", ar: "فهم أسس التحليلات الوصفية وإتقان تقنيات تشمل تحليل الانحراف وتحليل الاتجاهات وتحليل النسب المالية." }, duration: "30 min" },
          { num: "2.3", title: { en: "Predictive Models for Financial KPIs", ar: "النماذج التنبؤية لمؤشرات الأداء المالي" }, desc: { en: "Learn key predictive modeling techniques for finance, including regression analysis, time series models, and ensemble methods.", ar: "تعلم تقنيات النمذجة التنبؤية الرئيسية للتمويل، بما في ذلك تحليل الانحدار ونماذج السلاسل الزمنية والطرق المجمعة." }, duration: "30 min" },
          { num: "2.4", title: { en: "Integrating Analytics into Financial Dashboards", ar: "دمج التحليلات في لوحات المعلومات المالية" }, desc: { en: "Learn how to architect financial dashboards that combine descriptive and predictive analytics for real-time decision-making.", ar: "تعلم كيفية تصميم لوحات معلومات مالية تجمع بين التحليلات الوصفية والتنبؤية لاتخاذ القرارات في الوقت الفعلي." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "AI in Risk Management", ar: "الذكاء الاصطناعي في إدارة المخاطر" },
        videos: [
          { num: "3.1", title: { en: "AI-Based Risk Modeling & Scoring", ar: "نمذجة المخاطر والتسجيل القائم على الذكاء الاصطناعي" }, desc: { en: "Explore the evolution of risk modeling from traditional scorecards to AI-driven approaches, addressing model explainability and regulatory compliance.", ar: "استكشاف تطور نمذجة المخاطر من بطاقات الأداء التقليدية إلى الأساليب المدعومة بالذكاء الاصطناعي مع مراعاة قابلية تفسير النموذج والامتثال التنظيمي." }, duration: "30 min" },
          { num: "3.2", title: { en: "Fraud Detection & Compliance Monitoring", ar: "اكتشاف الاحتيال ومراقبة الامتثال" }, desc: { en: "Learn how AI powers real-time fraud detection through anomaly identification, explainable AI models, and compliance monitoring systems.", ar: "تعلم كيف يدعم الذكاء الاصطناعي اكتشاف الاحتيال في الوقت الفعلي من خلال تحديد الشذوذ ونماذج الذكاء الاصطناعي القابلة للتفسير وأنظمة مراقبة الامتثال." }, duration: "30 min" },
          { num: "3.3", title: { en: "Scenario Analysis & Stress Testing with AI", ar: "تحليل السيناريوهات واختبارات الإجهاد بالذكاء الاصطناعي" }, desc: { en: "Explore how AI transforms stress testing through advanced simulation techniques, generating complex scenarios and analyzing portfolio impacts.", ar: "استكشاف كيف يحوّل الذكاء الاصطناعي اختبارات الإجهاد من خلال تقنيات المحاكاة المتقدمة وتوليد سيناريوهات معقدة وتحليل تأثيرات المحافظ." }, duration: "30 min" },
        ],
      },
      {
        id: 4,
        title: { en: "AI for Corporate Valuation & Investment Decisions", ar: "الذكاء الاصطناعي للتقييم المؤسسي وقرارات الاستثمار" },
        videos: [
          { num: "4.1", title: { en: "AI-Enhanced Valuation Models", ar: "نماذج التقييم المعززة بالذكاء الاصطناعي" }, desc: { en: "Explore how AI automates and improves discounted cash flow analysis, comparable company valuation, and precedent transaction analysis.", ar: "استكشاف كيف يعمل الذكاء الاصطناعي على أتمتة وتحسين تحليل التدفقات النقدية المخصومة وتقييم الشركات المقارنة وتحليل المعاملات السابقة." }, duration: "30 min" },
          { num: "4.2", title: { en: "Investment Screening & Capital Allocation", ar: "فرز الاستثمارات وتخصيص رأس المال" }, desc: { en: "Understand how AI transforms investment sourcing and screening through deal flow identification and capital allocation optimization.", ar: "فهم كيف يحوّل الذكاء الاصطناعي مصادر الاستثمار والفرز من خلال تحديد تدفق الصفقات وتحسين تخصيص رأس المال." }, duration: "30 min" },
          { num: "4.3", title: { en: "Real-Time Market & Competitive Intelligence", ar: "استخبارات السوق والمنافسة في الوقت الفعلي" }, desc: { en: "Discover how AI powers real-time market intelligence through NLP analysis of earnings calls, news, and regulatory filings.", ar: "اكتشاف كيف يدعم الذكاء الاصطناعي استخبارات السوق في الوقت الفعلي من خلال تحليل معالجة اللغة الطبيعية لمكالمات الأرباح والأخبار والإيداعات التنظيمية." }, duration: "30 min" },
          { num: "4.4", title: { en: "M&A Analysis & Strategic Decision Applications", ar: "تحليل الاندماج والاستحواذ وتطبيقات القرارات الاستراتيجية" }, desc: { en: "Master how AI enhances mergers and acquisitions through automated due diligence, valuation modeling, and deal analytics.", ar: "إتقان كيفية تعزيز الذكاء الاصطناعي لعمليات الاندماج والاستحواذ من خلال العناية الواجبة الآلية ونمذجة التقييم وتحليلات الصفقات." }, duration: "30 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Integrated AI Applications in Strategic Finance", ar: "التطبيقات المتكاملة للذكاء الاصطناعي في التمويل الاستراتيجي" },
        videos: [
          { num: "5.1", title: { en: "Cross-Functional AI Integration Case Studies", ar: "دراسات حالة تكامل الذكاء الاصطناعي متعدد الوظائف" }, desc: { en: "Examine real-world case studies that combine AI-driven forecasting, analytics, risk management, and valuation across enterprise finance.", ar: "دراسة حالات واقعية تجمع بين التنبؤ والتحليلات وإدارة المخاطر والتقييم المدعومة بالذكاء الاصطناعي عبر تمويل المؤسسات." }, duration: "30 min" },
          { num: "5.2", title: { en: "Strategic Decision-Making with AI Scenarios", ar: "اتخاذ القرارات الاستراتيجية باستخدام سيناريوهات الذكاء الاصطناعي" }, desc: { en: "Build integrated scenario models for strategic planning, learn frameworks for AI-driven decision support and change management.", ar: "بناء نماذج سيناريوهات متكاملة للتخطيط الاستراتيجي وتعلم أطر عمل دعم القرار وإدارة التغيير المدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.3", title: { en: "Building Your AI Finance Roadmap", ar: "بناء خارطة طريق التمويل بالذكاء الاصطناعي" }, desc: { en: "Develop a practical AI finance implementation roadmap covering organizational readiness, governance, and managing AI transformation.", ar: "تطوير خارطة طريق عملية لتنفيذ التمويل بالذكاء الاصطناعي تغطي الجاهزية المؤسسية والحوكمة وإدارة التحول بالذكاء الاصطناعي." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CAIP — Certified Artificial Intelligence Practitioner              */
  /* ------------------------------------------------------------------ */

  caip: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By the end of the course, participants will be able to:",
      ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "Prompt Engineering",
          ar: "هندسة التلقين",
        },
        desc: {
          en: "Apply prompt engineering techniques to improve AI-generated outputs across multiple tools and platforms.",
          ar: "تطبيق تقنيات هندسة التلقين لتحسين مخرجات الذكاء الاصطناعي عبر أدوات ومنصات متعددة.",
        },
      },
      {
        title: {
          en: "Generative AI Platforms",
          ar: "منصات الذكاء الاصطناعي التوليدي",
        },
        desc: {
          en: "Compare different Generative AI platforms and their workplace uses, understanding unique strengths and limitations.",
          ar: "مقارنة منصات الذكاء الاصطناعي التوليدي واستخداماتها في بيئة العمل وفهم نقاط القوة والقيود لكل منصة.",
        },
      },
      {
        title: {
          en: "AI Content Creation",
          ar: "إنشاء المحتوى بالذكاء الاصطناعي",
        },
        desc: {
          en: "Create content using AI tools for audio, video, document summarization, images, and presentations.",
          ar: "إنشاء محتوى باستخدام أدوات الذكاء الاصطناعي للصوت والفيديو وتلخيص المستندات والصور والعروض التقديمية.",
        },
      },
      {
        title: {
          en: "Data Analysis & Automation",
          ar: "تحليل البيانات والأتمتة",
        },
        desc: {
          en: "Conduct business data analysis using AI-driven approaches and utilize automation tools to streamline professional processes.",
          ar: "إجراء تحليل بيانات الأعمال باستخدام أساليب الذكاء الاصطناعي واستخدام أدوات الأتمتة لتبسيط العمليات المهنية.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "This course is intended for professionals without technical backgrounds who want to adopt AI tools in their daily work. Ideal participants are from business unit departments such as HR, Finance, Accounting, Customer Service, Sales and Marketing, and Management.",
      ar: "هذه الدورة مخصصة لغير التقنيين الذين يرغبون في تبني أدوات الذكاء الاصطناعي في أعمالهم اليومية. وهي مثالية للعاملين في إدارات مثل الموارد البشرية والمالية والمحاسبة وخدمة العملاء والتسويق والمبيعات والإدارة.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Prompt Engineering", ar: "هندسة التلقين" } },
      { text: { en: "Generative AI Platforms", ar: "منصات الذكاء الاصطناعي التوليدي" } },
      { text: { en: "Content Creation", ar: "إنشاء المحتوى" } },
      { text: { en: "Data Analysis", ar: "تحليل البيانات" } },
      { text: { en: "Machine Learning", ar: "تعلم الآلة" } },
      { text: { en: "Agentic AI", ar: "الذكاء الاصطناعي الوكيل" } },
      { text: { en: "Model Context Protocol (MCP)", ar: "بروتوكول سياق النموذج (MCP)" } },
      { text: { en: "Automation", ar: "الأتمتة" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "8 Modules \u2022 32 Video Lessons \u2022 5 Days of Hands-On Training",
      ar: "8 وحدات \u2022 32 درس فيديو \u2022 5 أيام تدريب عملي",
    },
    prerequisiteNote: {
      en: "AI Tools to be Used: ChatGPT, Copilot, Gemini, Excel, Python, KNIME, and other GenAI applications.",
      ar: "أدوات الذكاء الاصطناعي المستخدمة: ChatGPT، Copilot، Gemini، Excel، Python، KNIME، وغيرها من تطبيقات الذكاء الاصطناعي التوليدي.",
    },
    modules: [
      {
        id: 1,
        title: { en: "Prompt Engineering", ar: "هندسة التلقين" },
        videos: [
          { num: "1.1", title: { en: "Understanding the Role of Prompts in Generative AI", ar: "فهم دور الأوامر في الذكاء الاصطناعي التوليدي" }, desc: { en: "Explore the fundamentals of how prompts drive AI outputs and why prompt design is critical for quality results.", ar: "استكشاف أساسيات كيفية تحريك الأوامر لمخرجات الذكاء الاصطناعي وأهمية تصميم الأوامر للحصول على نتائج عالية الجودة." }, duration: "25 min" },
          { num: "1.2", title: { en: "Structuring Instructions for Accuracy & Relevance", ar: "صياغة التعليمات لتحقيق الدقة والملاءمة" }, desc: { en: "Learn how to structure clear, precise instructions that guide AI models to produce accurate and relevant outputs.", ar: "تعلم كيفية صياغة تعليمات واضحة ودقيقة توجه نماذج الذكاء الاصطناعي لإنتاج مخرجات دقيقة وملائمة." }, duration: "25 min" },
          { num: "1.3", title: { en: "Iterating & Refining Prompts for Better Outcomes", ar: "التكرار والتحسين للحصول على مخرجات أفضل" }, desc: { en: "Master the iterative process of testing, evaluating, and refining prompts to progressively improve AI-generated results.", ar: "إتقان عملية الاختبار والتقييم والتحسين التكرارية للأوامر لتحسين نتائج الذكاء الاصطناعي تدريجياً." }, duration: "25 min" },
          { num: "1.4", title: { en: "Applying Prompt Strategies Across Multiple Tools", ar: "تطبيق استراتيجيات الأوامر عبر أدوات متعددة" }, desc: { en: "Apply proven prompt engineering strategies across different AI platforms including ChatGPT, Gemini, and Copilot.", ar: "تطبيق استراتيجيات هندسة الأوامر المثبتة عبر منصات ذكاء اصطناعي مختلفة بما في ذلك ChatGPT وGemini وCopilot." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Difference Between GPTs", ar: "الاختلاف بين نماذج GPT" },
        videos: [
          { num: "2.1", title: { en: "ChatGPT, Gemini & Copilot Comparison", ar: "مقارنة ChatGPT وGemini وCopilot" }, desc: { en: "Compare the three leading generative AI platforms side-by-side, examining their architectures, capabilities, and ideal use cases.", ar: "مقارنة منصات الذكاء الاصطناعي التوليدي الثلاث الرائدة جنباً إلى جنب، مع دراسة بنيتها وقدراتها وحالات الاستخدام المثالية." }, duration: "25 min" },
          { num: "2.2", title: { en: "Understanding Unique Strengths & Limitations", ar: "فهم نقاط القوة والقيود لكل منصة" }, desc: { en: "Deep dive into the specific strengths and limitations of each platform to make informed decisions about tool selection.", ar: "التعمق في نقاط القوة والقيود المحددة لكل منصة لاتخاذ قرارات مستنيرة حول اختيار الأدوات." }, duration: "25 min" },
          { num: "2.3", title: { en: "Platform Selection for Workplace Tasks", ar: "اختيار المنصة المناسبة لمهام بيئة العمل" }, desc: { en: "Learn frameworks for selecting the right AI platform based on specific workplace task requirements and constraints.", ar: "تعلم أطر عمل لاختيار منصة الذكاء الاصطناعي المناسبة بناءً على متطلبات مهام بيئة العمل المحددة." }, duration: "25 min" },
          { num: "2.4", title: { en: "Leveraging Multiple Tools for Improved Outcomes", ar: "استخدام أدوات متعددة للحصول على نتائج أفضل" }, desc: { en: "Discover strategies for combining multiple AI tools in workflows to achieve superior results and maximize productivity.", ar: "اكتشاف استراتيجيات دمج أدوات الذكاء الاصطناعي المتعددة في سير العمل لتحقيق نتائج متفوقة وزيادة الإنتاجية." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "AI Tools for Content Creation", ar: "أدوات الذكاء الاصطناعي لإنتاج المحتوى" },
        videos: [
          { num: "3.1", title: { en: "Presentations Design Using AI Platforms", ar: "تصميم العروض التقديمية باستخدام الذكاء الاصطناعي" }, desc: { en: "Create professional presentations using AI-powered design tools that automate layout, visuals, and content structuring.", ar: "إنشاء عروض تقديمية احترافية باستخدام أدوات التصميم المدعومة بالذكاء الاصطناعي التي تؤتمت التخطيط والمرئيات وهيكلة المحتوى." }, duration: "25 min" },
          { num: "3.2", title: { en: "Images Production for Professional Communication", ar: "إنتاج الصور للاستخدام المهني" }, desc: { en: "Generate professional-quality images using AI tools for business communications, marketing materials, and reports.", ar: "إنتاج صور بجودة احترافية باستخدام أدوات الذكاء الاصطناعي للاتصالات التجارية والمواد التسويقية والتقارير." }, duration: "25 min" },
          { num: "3.3", title: { en: "Videos Creation with AI-Driven Applications", ar: "إنشاء مقاطع الفيديو بالتطبيقات المعتمدة على الذكاء الاصطناعي" }, desc: { en: "Produce engaging video content using AI applications for training, marketing, and internal communication purposes.", ar: "إنتاج محتوى فيديو جذاب باستخدام تطبيقات الذكاء الاصطناعي لأغراض التدريب والتسويق والاتصالات الداخلية." }, duration: "25 min" },
          { num: "3.4", title: { en: "Audio & Written Content Generation", ar: "إنشاء المحتوى الصوتي والمكتوب" }, desc: { en: "Leverage AI for generating audio content, document summarization, and professional written materials efficiently.", ar: "الاستفادة من الذكاء الاصطناعي لإنشاء المحتوى الصوتي وتلخيص المستندات والمواد المكتوبة المهنية بكفاءة." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "AI Tools for Data Analysis", ar: "أدوات الذكاء الاصطناعي لتحليل البيانات" },
        videos: [
          { num: "4.1", title: { en: "Data Preparation for Analysis", ar: "تجهيز البيانات للتحليل" }, desc: { en: "Learn how to use AI tools to clean, organize, and prepare raw data for effective business analysis.", ar: "تعلم كيفية استخدام أدوات الذكاء الاصطناعي لتنظيف وتنظيم وتجهيز البيانات الخام للتحليل الفعال للأعمال." }, duration: "25 min" },
          { num: "4.2", title: { en: "Data Analysis & Insight Extraction", ar: "تحليل البيانات واستخلاص الرؤى" }, desc: { en: "Apply AI-driven analysis techniques to extract meaningful business insights from structured and unstructured data.", ar: "تطبيق تقنيات التحليل المعتمدة على الذكاء الاصطناعي لاستخلاص رؤى أعمال ذات معنى من البيانات المهيكلة وغير المهيكلة." }, duration: "25 min" },
          { num: "4.3", title: { en: "Report Creation with AI", ar: "إعداد التقارير بالذكاء الاصطناعي" }, desc: { en: "Generate professional reports using AI tools that automate data summarization, formatting, and presentation.", ar: "إنشاء تقارير مهنية باستخدام أدوات الذكاء الاصطناعي التي تؤتمت تلخيص البيانات والتنسيق والعرض." }, duration: "25 min" },
          { num: "4.4", title: { en: "Data Visualization & Communication", ar: "عرض البيانات والتواصل باستخدام الرسوم البيانية" }, desc: { en: "Create compelling data visualizations and communicate findings effectively using AI-powered charting and dashboard tools.", ar: "إنشاء تصورات بيانية مقنعة والتواصل بالنتائج بفعالية باستخدام أدوات الرسوم البيانية ولوحات المعلومات المدعومة بالذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Low-Code/No-Code Machine Learning", ar: "تعلم الآلة بدون برمجة" },
        videos: [
          { num: "5.1", title: { en: "Clustering & Segmentation", ar: "التجميع والتقسيم" }, desc: { en: "Build clustering models using no-code platforms to segment customers, products, and data into meaningful groups.", ar: "بناء نماذج التجميع باستخدام منصات بدون برمجة لتقسيم العملاء والمنتجات والبيانات إلى مجموعات ذات معنى." }, duration: "25 min" },
          { num: "5.2", title: { en: "Classification for Predictive Outcomes", ar: "التصنيف للتنبؤ بالنتائج" }, desc: { en: "Create classification models that predict outcomes such as customer churn, loan approval, and risk categories.", ar: "إنشاء نماذج تصنيف تتنبأ بالنتائج مثل فقدان العملاء والموافقة على القروض وفئات المخاطر." }, duration: "25 min" },
          { num: "5.3", title: { en: "Market Basket Analysis with Visual Tools", ar: "تحليل سلة السوق بالأدوات المرئية" }, desc: { en: "Perform market basket analysis using visual ML tools to discover product associations and buying patterns.", ar: "إجراء تحليل سلة السوق باستخدام أدوات التعلم الآلي المرئية لاكتشاف ارتباطات المنتجات وأنماط الشراء." }, duration: "25 min" },
          { num: "5.4", title: { en: "Text Sentiment Analysis for Insights", ar: "تحليل المشاعر النصية للرؤى" }, desc: { en: "Apply sentiment analysis techniques to customer feedback, reviews, and social media data for business decisions.", ar: "تطبيق تقنيات تحليل المشاعر على ملاحظات العملاء والمراجعات وبيانات وسائل التواصل الاجتماعي لقرارات الأعمال." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Agentic AI", ar: "الذكاء الاصطناعي الوكيل" },
        videos: [
          { num: "6.1", title: { en: "Concept of Autonomous AI Agents", ar: "مفهوم الوكلاء الذكيين المستقلين" }, desc: { en: "Understand the foundations of agentic AI, how autonomous agents operate, and their role in modern enterprise workflows.", ar: "فهم أسس الذكاء الاصطناعي الوكيل وكيفية عمل الوكلاء المستقلين ودورهم في سير العمل المؤسسي الحديث." }, duration: "25 min" },
          { num: "6.2", title: { en: "Task Execution Agents", ar: "وكلاء تنفيذ المهام" }, desc: { en: "Learn how AI agents autonomously execute complex tasks, manage multi-step processes, and deliver results.", ar: "تعلم كيف ينفذ وكلاء الذكاء الاصطناعي المهام المعقدة بشكل مستقل ويديرون العمليات متعددة الخطوات ويقدمون النتائج." }, duration: "25 min" },
          { num: "6.3", title: { en: "Agentic AI for Research & Workflow Assistance", ar: "الذكاء الاصطناعي الوكيل للبحث والمساعدة في سير العمل" }, desc: { en: "Explore how agentic AI assists in research tasks, automates information gathering, and streamlines business workflows.", ar: "استكشاف كيف يساعد الذكاء الاصطناعي الوكيل في مهام البحث وأتمتة جمع المعلومات وتبسيط سير العمل." }, duration: "25 min" },
          { num: "6.4", title: { en: "Tools for API Creation", ar: "أدوات إنشاء واجهات البرمجة" }, desc: { en: "Discover tools and platforms for building API integrations that enable AI agents to interact with enterprise systems.", ar: "اكتشاف الأدوات والمنصات لبناء تكاملات واجهات البرمجة التي تمكن وكلاء الذكاء الاصطناعي من التفاعل مع أنظمة المؤسسة." }, duration: "25 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Model Context Protocol (MCP)", ar: "بروتوكول سياق النموذج (MCP)" },
        videos: [
          { num: "7.1", title: { en: "Structure & Purpose of MCP", ar: "الهيكل والغرض من MCP" }, desc: { en: "Understand the architecture and purpose of Model Context Protocol and how it standardizes AI-data interactions.", ar: "فهم بنية بروتوكول سياق النموذج والغرض منه وكيف يوحد التفاعلات بين الذكاء الاصطناعي والبيانات." }, duration: "25 min" },
          { num: "7.2", title: { en: "Integration of AI Models with Enterprise Data", ar: "دمج نماذج الذكاء الاصطناعي مع بيانات المؤسسة" }, desc: { en: "Learn how MCP enables seamless integration between AI models and enterprise data sources for contextual intelligence.", ar: "تعلم كيف يمكّن MCP التكامل السلس بين نماذج الذكاء الاصطناعي ومصادر بيانات المؤسسة للذكاء السياقي." }, duration: "25 min" },
          { num: "7.3", title: { en: "Security, Governance & Controlled Access", ar: "الأمن والحوكمة والتحكم في الوصول" }, desc: { en: "Explore security protocols, governance frameworks, and access control mechanisms within MCP implementations.", ar: "استكشاف بروتوكولات الأمن وأطر الحوكمة وآليات التحكم في الوصول ضمن تطبيقات MCP." }, duration: "25 min" },
          { num: "7.4", title: { en: "MCP Applications in Analytics, Reporting & Automation", ar: "تطبيقات MCP في التحليلات والتقارير والأتمتة" }, desc: { en: "Apply MCP in real-world scenarios for analytics, automated reporting, and workflow automation across the enterprise.", ar: "تطبيق MCP في سيناريوهات واقعية للتحليلات والتقارير الآلية وأتمتة سير العمل عبر المؤسسة." }, duration: "25 min" },
        ],
      },
      {
        id: 8,
        title: { en: "AI Tools for Automation", ar: "أدوات الذكاء الاصطناعي للأتمتة" },
        videos: [
          { num: "8.1", title: { en: "Task Identification for Automation", ar: "تحديد المهام القابلة للأتمتة" }, desc: { en: "Learn frameworks for identifying repetitive tasks and processes that are ideal candidates for AI-powered automation.", ar: "تعلم أطر عمل لتحديد المهام والعمليات المتكررة المثالية للأتمتة المدعومة بالذكاء الاصطناعي." }, duration: "25 min" },
          { num: "8.2", title: { en: "Automation Tools Utilization", ar: "استخدام أدوات الأتمتة" }, desc: { en: "Master the leading AI automation tools and platforms, understanding their capabilities for different business scenarios.", ar: "إتقان أدوات ومنصات الأتمتة الرائدة بالذكاء الاصطناعي وفهم قدراتها لسيناريوهات الأعمال المختلفة." }, duration: "25 min" },
          { num: "8.3", title: { en: "Custom Automation Workflow Design", ar: "بناء تدفقات عمل مخصصة" }, desc: { en: "Design and build custom automation workflows tailored to specific business processes and organizational needs.", ar: "تصميم وبناء تدفقات عمل أتمتة مخصصة تناسب عمليات الأعمال المحددة واحتياجات المؤسسة." }, duration: "25 min" },
          { num: "8.4", title: { en: "Automation Process Implementation", ar: "تنفيذ عملية الأتمتة" }, desc: { en: "Implement end-to-end automation processes from planning through deployment, including testing and optimization.", ar: "تنفيذ عمليات الأتمتة من البداية إلى النهاية من التخطيط حتى النشر بما في ذلك الاختبار والتحسين." }, duration: "25 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CPAFG — Certified Professional in AI Forensic Governance           */
  /* ------------------------------------------------------------------ */

  cpafg: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By the end of the course, participants will be able to:",
      ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "AI Governance & Ethics",
          ar: "حوكمة الذكاء الاصطناعي والأخلاقيات",
        },
        desc: {
          en: "Analyze the foundations of AI governance and its ethical implications. Design governance frameworks that ensure algorithmic transparency and fairness.",
          ar: "تحليل أسس حوكمة الذكاء الاصطناعي وانعكاساتها الأخلاقية. تصميم أطر حوكمة تضمن الشفافية والعدالة الخوارزمية.",
        },
      },
      {
        title: {
          en: "Forensic Data Analytics",
          ar: "التحليلات الجنائية للبيانات",
        },
        desc: {
          en: "Apply forensic methodologies to AI-driven data environments. Interpret and manage digital evidence using forensic analytics tools.",
          ar: "تطبيق المنهجيات الجنائية في بيئات البيانات المعتمدة على الذكاء الاصطناعي. تفسير وإدارة الأدلة الرقمية باستخدام أدوات التحليل الجنائي.",
        },
      },
      {
        title: {
          en: "Fraud Detection & Compliance",
          ar: "كشف الاحتيال والالتزام",
        },
        desc: {
          en: "Evaluate the use of machine learning in fraud detection and compliance monitoring. Implement AI-based audit and assurance practices aligned with global standards.",
          ar: "تقييم استخدام تعلم الآلة في كشف الاحتيال ومراقبة الالتزام. تطبيق ممارسات المراجعة المعتمدة على الذكاء الاصطناعي بما يتوافق مع المعايير العالمية.",
        },
      },
      {
        title: {
          en: "Cyber Risk & Digital Transformation",
          ar: "المخاطر السيبرانية والتحول الرقمي",
        },
        desc: {
          en: "Develop strategies to mitigate cyber and data integrity risks. Integrate forensic governance into enterprise-wide digital transformation programs.",
          ar: "تطوير استراتيجيات للحد من المخاطر السيبرانية ومخاطر سلامة البيانات. دمج الحوكمة الجنائية ضمن برامج التحول الرقمي على مستوى المؤسسة.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "This course is designed for professionals who aspire to lead the future of governance with confidence and credibility. It welcomes internal auditors, forensic accountants, compliance officers, executives driving responsible AI adoption, legal advisors, regulators, and risk specialists navigating the ethical, technical, and strategic challenges of AI governance.",
      ar: "تم تصميم هذه الدورة للمهنيين الطامحين إلى قيادة مستقبل الحوكمة بثقة ومصداقية. وتستهدف المراجعين الداخليين والمحاسبين الجنائيين ومسؤولي الالتزام والقيادات التنفيذية والمستشارين القانونيين والجهات التنظيمية ومتخصصي المخاطر.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "AI Governance Frameworks", ar: "أطر حوكمة الذكاء الاصطناعي" } },
      { text: { en: "Forensic Data Analytics", ar: "التحليلات الجنائية للبيانات" } },
      { text: { en: "Ethical AI Oversight", ar: "الإشراف الأخلاقي على الذكاء الاصطناعي" } },
      { text: { en: "Digital Evidence Management", ar: "إدارة الأدلة الرقمية" } },
      { text: { en: "Fraud and Compliance", ar: "الاحتيال والالتزام" } },
      { text: { en: "Algorithmic Accountability", ar: "المساءلة الخوارزمية" } },
      { text: { en: "Cyber Risk Resilience", ar: "المرونة في مواجهة المخاطر السيبرانية" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "7 Modules \u2022 35 Video Lessons \u2022 5 Days of Hands-On Training",
      ar: "7 وحدات \u2022 35 درس فيديو \u2022 5 أيام تدريب عملي",
    },
    modules: [
      {
        id: 1,
        title: { en: "AI Governance Frameworks", ar: "أطر حوكمة الذكاء الاصطناعي" },
        videos: [
          { num: "1.1", title: { en: "AI Governance Pillars & Global Standards", ar: "ركائز حوكمة الذكاء الاصطناعي والمعايير العالمية" }, desc: { en: "Understand the foundational pillars of AI governance and the global standards that guide responsible AI deployment across industries.", ar: "فهم ركائز حوكمة الذكاء الاصطناعي والمعايير العالمية ذات الصلة التي توجه نشر الذكاء الاصطناعي المسؤول." }, duration: "25 min" },
          { num: "1.2", title: { en: "Mapping AI Accountability to Organizational Structures", ar: "مواءمة المساءلة الخوارزمية مع الهياكل التنظيمية" }, desc: { en: "Learn how to map AI accountability frameworks to existing organizational structures for effective governance implementation.", ar: "تعلم كيفية مواءمة أطر المساءلة الخوارزمية مع الهياكل التنظيمية القائمة لتطبيق حوكمة فعالة." }, duration: "25 min" },
          { num: "1.3", title: { en: "Regulatory Frameworks: EU AI Act, OECD & ISO 42001", ar: "الأطر التنظيمية: تشريع الاتحاد الأوروبي وOECD وISO 42001" }, desc: { en: "Explore key regulatory frameworks including the EU AI Act, OECD AI Principles, and ISO 42001 for AI management systems.", ar: "استكشاف الأطر التنظيمية الرئيسية بما في ذلك تشريع الاتحاد الأوروبي للذكاء الاصطناعي ومبادئ OECD ومعيار ISO 42001." }, duration: "25 min" },
          { num: "1.4", title: { en: "Integrating Governance with Enterprise Risk Management", ar: "دمج الحوكمة مع إدارة المخاطر المؤسسية" }, desc: { en: "Integrate AI governance practices with enterprise risk management frameworks for comprehensive organizational oversight.", ar: "دمج ممارسات حوكمة الذكاء الاصطناعي مع أطر إدارة المخاطر المؤسسية للرقابة الشاملة على المؤسسة." }, duration: "25 min" },
          { num: "1.5", title: { en: "Evaluating Maturity Models for AI Governance", ar: "تقييم نماذج النضج لحوكمة الذكاء الاصطناعي" }, desc: { en: "Assess and apply AI governance maturity models to benchmark organizational readiness and drive continuous improvement.", ar: "تقييم وتطبيق نماذج نضج حوكمة الذكاء الاصطناعي لقياس جاهزية المؤسسة وتحقيق التحسين المستمر." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Forensic Data Analytics", ar: "التحليلات الجنائية للبيانات" },
        videos: [
          { num: "2.1", title: { en: "Foundations of Data Forensics & Audit Trails", ar: "أسس الأدلة الرقمية ومسارات التدقيق" }, desc: { en: "Master the fundamentals of data forensics, including establishing and maintaining comprehensive audit trails.", ar: "إتقان أساسيات الأدلة الرقمية بما في ذلك إنشاء وصيانة مسارات تدقيق شاملة." }, duration: "25 min" },
          { num: "2.2", title: { en: "Detecting Anomalies Using AI & Machine Learning", ar: "كشف الشذوذ باستخدام الذكاء الاصطناعي وتعلم الآلة" }, desc: { en: "Apply AI and machine learning techniques to detect data anomalies, patterns of fraud, and suspicious activities.", ar: "تطبيق تقنيات الذكاء الاصطناعي وتعلم الآلة لكشف شذوذ البيانات وأنماط الاحتيال والأنشطة المشبوهة." }, duration: "25 min" },
          { num: "2.3", title: { en: "Data Visualization for Forensic Insight", ar: "التصور البياني لاستخلاص الرؤى الجنائية" }, desc: { en: "Leverage data visualization techniques to uncover forensic insights and communicate findings to stakeholders.", ar: "توظيف تقنيات التصور البياني لاستخلاص الرؤى الجنائية والتواصل بالنتائج مع أصحاب المصلحة." }, duration: "25 min" },
          { num: "2.4", title: { en: "Predictive Analytics for Fraud Detection", ar: "التحليلات التنبؤية لكشف الاحتيال" }, desc: { en: "Build predictive analytics models that proactively identify potential fraud before it occurs using historical patterns.", ar: "بناء نماذج تحليلات تنبؤية تحدد الاحتيال المحتمل بشكل استباقي باستخدام الأنماط التاريخية." }, duration: "25 min" },
          { num: "2.5", title: { en: "Ensuring Integrity & Reproducibility of Forensic Data", ar: "ضمان سلامة البيانات الجنائية وقابليتها لإعادة التحقق" }, desc: { en: "Implement practices that ensure forensic data integrity, reproducibility, and admissibility in legal proceedings.", ar: "تطبيق ممارسات تضمن سلامة البيانات الجنائية وقابليتها لإعادة التحقق والقبول في الإجراءات القانونية." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Ethical AI Oversight", ar: "الإشراف الأخلاقي على الذكاء الاصطناعي" },
        videos: [
          { num: "3.1", title: { en: "Defining Ethical Boundaries in AI Investigations", ar: "تحديد الحدود الأخلاقية في التحقيقات المعتمدة على الذكاء الاصطناعي" }, desc: { en: "Establish clear ethical boundaries and guidelines for conducting AI-powered investigations and decision-making.", ar: "وضع حدود وإرشادات أخلاقية واضحة لإجراء التحقيقات واتخاذ القرارات المعتمدة على الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "3.2", title: { en: "Identifying Algorithmic Bias & Discrimination", ar: "اكتشاف التحيز والتمييز الخوارزمي" }, desc: { en: "Learn techniques to identify, measure, and address algorithmic bias and discrimination in AI systems.", ar: "تعلم تقنيات تحديد وقياس ومعالجة التحيز والتمييز الخوارزمي في أنظمة الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "3.3", title: { en: "Building Responsible AI Oversight Mechanisms", ar: "بناء آليات إشراف مسؤولة على الذكاء الاصطناعي" }, desc: { en: "Design and implement responsible AI oversight mechanisms that balance innovation with ethical accountability.", ar: "تصميم وتنفيذ آليات إشراف مسؤولة على الذكاء الاصطناعي توازن بين الابتكار والمساءلة الأخلاقية." }, duration: "25 min" },
          { num: "3.4", title: { en: "AI Explainability & Transparency Principles", ar: "مبادئ الشفافية وقابلية تفسير النماذج" }, desc: { en: "Apply explainability and transparency principles to ensure AI systems are interpretable and auditable.", ar: "تطبيق مبادئ الشفافية وقابلية التفسير لضمان أن أنظمة الذكاء الاصطناعي قابلة للتفسير والتدقيق." }, duration: "25 min" },
          { num: "3.5", title: { en: "Ethical Decision-Making in Digital Investigations", ar: "اتخاذ القرار الأخلاقي في التحقيقات الرقمية" }, desc: { en: "Apply ethical decision-making frameworks when conducting digital investigations using AI-powered tools.", ar: "تطبيق أطر اتخاذ القرار الأخلاقي عند إجراء التحقيقات الرقمية باستخدام أدوات الذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Digital Evidence Management", ar: "إدارة الأدلة الرقمية" },
        videos: [
          { num: "4.1", title: { en: "Digital Evidence Collection & Preservation", ar: "جمع الأدلة الرقمية وحفظها" }, desc: { en: "Master the principles and best practices for collecting and preserving digital evidence in AI-driven environments.", ar: "إتقان مبادئ وأفضل ممارسات جمع وحفظ الأدلة الرقمية في البيئات المعتمدة على الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "4.2", title: { en: "Chain of Custody & Admissibility Standards", ar: "سلسلة الحيازة ومعايير القبول القضائي" }, desc: { en: "Understand chain of custody requirements and admissibility standards for digital evidence in legal proceedings.", ar: "فهم متطلبات سلسلة الحيازة ومعايير القبول القضائي للأدلة الرقمية في الإجراءات القانونية." }, duration: "25 min" },
          { num: "4.3", title: { en: "AI in Digital Forensics Automation", ar: "الذكاء الاصطناعي في أتمتة التحليل الجنائي" }, desc: { en: "Explore how AI automates digital forensics processes including evidence discovery, analysis, and classification.", ar: "استكشاف كيف يؤتمت الذكاء الاصطناعي عمليات التحليل الجنائي الرقمي بما في ذلك اكتشاف الأدلة والتحليل والتصنيف." }, duration: "25 min" },
          { num: "4.4", title: { en: "Managing Metadata & System Logs Securely", ar: "إدارة البيانات الوصفية وسجلات الأنظمة بشكل آمن" }, desc: { en: "Implement secure practices for managing metadata and system logs as critical sources of forensic evidence.", ar: "تطبيق ممارسات آمنة لإدارة البيانات الوصفية وسجلات الأنظمة كمصادر حيوية للأدلة الجنائية." }, duration: "25 min" },
          { num: "4.5", title: { en: "Case Documentation & Forensic Reporting", ar: "توثيق القضايا وإعداد التقارير الجنائية" }, desc: { en: "Master best practices in case documentation and forensic reporting for clear, defensible, and professional outputs.", ar: "إتقان أفضل ممارسات توثيق القضايا وإعداد التقارير الجنائية للحصول على مخرجات واضحة ومهنية." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Fraud & Compliance", ar: "الاحتيال والالتزام" },
        videos: [
          { num: "5.1", title: { en: "AI Applications in Anti-Fraud & AML Programs", ar: "تطبيقات الذكاء الاصطناعي في مكافحة الاحتيال وغسل الأموال" }, desc: { en: "Explore how AI enhances anti-fraud and anti-money laundering programs through pattern detection and risk analysis.", ar: "استكشاف كيف يعزز الذكاء الاصطناعي برامج مكافحة الاحتيال وغسل الأموال من خلال كشف الأنماط وتحليل المخاطر." }, duration: "25 min" },
          { num: "5.2", title: { en: "Monitoring Compliance Through Automated Systems", ar: "مراقبة الالتزام عبر الأنظمة المؤتمتة" }, desc: { en: "Implement automated compliance monitoring systems that continuously track regulatory adherence and flag violations.", ar: "تطبيق أنظمة مراقبة التزام مؤتمتة تتابع الامتثال التنظيمي باستمرار وتكشف المخالفات." }, duration: "25 min" },
          { num: "5.3", title: { en: "Red Flags & AI-Based Risk Scoring Models", ar: "مؤشرات الخطر ونماذج تقييم المخاطر بالذكاء الاصطناعي" }, desc: { en: "Build AI-powered risk scoring models that identify red flags and prioritize investigations based on risk levels.", ar: "بناء نماذج تقييم مخاطر مدعومة بالذكاء الاصطناعي تحدد مؤشرات الخطر وتحدد أولويات التحقيق بناءً على مستويات المخاطر." }, duration: "25 min" },
          { num: "5.4", title: { en: "Investigating Complex Fraud with AI Tools", ar: "التحقيق في سيناريوهات الاحتيال المعقدة بأدوات ذكية" }, desc: { en: "Apply AI tools to investigate complex, multi-layered fraud scenarios involving sophisticated schemes and techniques.", ar: "تطبيق أدوات الذكاء الاصطناعي للتحقيق في سيناريوهات الاحتيال المعقدة متعددة الطبقات." }, duration: "25 min" },
          { num: "5.5", title: { en: "Coordination Between Forensic & Compliance Teams", ar: "التنسيق بين فرق التحقيق الجنائي والالتزام" }, desc: { en: "Establish effective coordination frameworks between forensic investigation and compliance teams for unified responses.", ar: "إنشاء أطر تنسيق فعالة بين فرق التحقيق الجنائي والالتزام لاستجابات موحدة." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Algorithmic Accountability", ar: "المساءلة الخوارزمية" },
        videos: [
          { num: "6.1", title: { en: "Governance of ML Models & Outcomes", ar: "حوكمة نماذج تعلم الآلة ومخرجاتها" }, desc: { en: "Establish governance frameworks for managing machine learning models throughout their lifecycle and ensuring quality outcomes.", ar: "إنشاء أطر حوكمة لإدارة نماذج تعلم الآلة خلال دورة حياتها وضمان جودة المخرجات." }, duration: "25 min" },
          { num: "6.2", title: { en: "Bias Detection & Fairness Auditing", ar: "تدقيق التحيز والعدالة في الخوارزميات" }, desc: { en: "Apply systematic approaches to detect bias in algorithms and conduct fairness audits across AI systems.", ar: "تطبيق مناهج منظمة لكشف التحيز في الخوارزميات وإجراء تدقيق العدالة عبر أنظمة الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "6.3", title: { en: "Model Validation & Continuous Assurance", ar: "التحقق من النماذج وممارسات التوكيد المستمر" }, desc: { en: "Implement model validation practices and continuous assurance processes to maintain algorithmic reliability.", ar: "تطبيق ممارسات التحقق من النماذج وعمليات التوكيد المستمر للحفاظ على موثوقية الخوارزميات." }, duration: "25 min" },
          { num: "6.4", title: { en: "Transparency Documentation: Model Cards & Audit Trails", ar: "توثيق الشفافية: بطاقات النماذج ومسارات التدقيق" }, desc: { en: "Create comprehensive transparency documentation including model cards, audit trails, and decision logs.", ar: "إنشاء وثائق شفافية شاملة تتضمن بطاقات النماذج ومسارات التدقيق وسجلات القرارات." }, duration: "25 min" },
          { num: "6.5", title: { en: "Designing Control Frameworks for Algorithmic Risk", ar: "تصميم أطر رقابية لإدارة المخاطر الخوارزمية" }, desc: { en: "Design robust control frameworks that identify, assess, and mitigate algorithmic risks across the organization.", ar: "تصميم أطر رقابية متينة تحدد وتقيّم وتخفف المخاطر الخوارزمية عبر المؤسسة." }, duration: "25 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Cyber Risk Resilience", ar: "المرونة في مواجهة المخاطر السيبرانية" },
        videos: [
          { num: "7.1", title: { en: "Linking Forensic Governance to Cybersecurity Frameworks", ar: "ربط الحوكمة الجنائية بأطر الأمن السيبراني" }, desc: { en: "Integrate forensic governance practices with established cybersecurity frameworks for comprehensive protection.", ar: "دمج ممارسات الحوكمة الجنائية مع أطر الأمن السيبراني المعتمدة للحماية الشاملة." }, duration: "25 min" },
          { num: "7.2", title: { en: "Threat Intelligence & AI-Based Incident Detection", ar: "استخبارات التهديدات والكشف المدعوم بالذكاء الاصطناعي" }, desc: { en: "Leverage AI for threat intelligence gathering and real-time incident detection to proactively defend against cyber threats.", ar: "توظيف الذكاء الاصطناعي لجمع استخبارات التهديدات والكشف عن الحوادث في الوقت الفعلي للدفاع الاستباقي." }, duration: "25 min" },
          { num: "7.3", title: { en: "Post-Incident Forensic Reconstruction & Root Cause Analysis", ar: "إعادة بناء الحوادث وتحليل الأسباب الجذرية" }, desc: { en: "Conduct thorough post-incident forensic reconstruction and root cause analysis to understand and prevent future breaches.", ar: "إجراء إعادة بناء جنائي شامل للحوادث وتحليل الأسباب الجذرية لفهم ومنع الاختراقات المستقبلية." }, duration: "25 min" },
          { num: "7.4", title: { en: "Integrating Forensic AI with SOC & GRC Platforms", ar: "دمج الذكاء الاصطناعي الجنائي مع منصات SOC وGRC" }, desc: { en: "Integrate forensic AI capabilities with Security Operations Centers and Governance, Risk & Compliance platforms.", ar: "دمج قدرات الذكاء الاصطناعي الجنائي مع مراكز العمليات الأمنية ومنصات الحوكمة والمخاطر والالتزام." }, duration: "25 min" },
          { num: "7.5", title: { en: "Building Resilience Through Data Governance & Recovery", ar: "بناء المرونة المؤسسية عبر حوكمة البيانات والتعافي" }, desc: { en: "Build organizational resilience through robust data governance practices and comprehensive recovery strategies.", ar: "بناء المرونة المؤسسية من خلال ممارسات حوكمة البيانات المتينة واستراتيجيات التعافي الشاملة." }, duration: "25 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CSBIP — Certified Strategic Business Intelligence Partner          */
  /* ------------------------------------------------------------------ */

  csbip: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By the end of the course, participants will be able to:",
      ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "Data Processing & BI Analysis",
          ar: "معالجة البيانات وتحليل ذكاء الأعمال",
        },
        desc: {
          en: "Utilize data tools to process data and analyze it to extract powerful insights using BI tools.",
          ar: "استخدام أدوات البيانات لمعالجة البيانات وتحليلها لاستخلاص رؤى قوية باستخدام أدوات ذكاء الأعمال.",
        },
      },
      {
        title: {
          en: "Strategic Thinking & Decision Intelligence",
          ar: "التفكير الاستراتيجي وذكاء القرار",
        },
        desc: {
          en: "Think strategically about building one system and drive decisions. Construct business problem statements to lead BI initiatives.",
          ar: "التفكير استراتيجياً لبناء منظومة موحدة تقود اتخاذ القرار. صياغة بيان المشكلة التجارية لقيادة مبادرات ذكاء الأعمال.",
        },
      },
      {
        title: {
          en: "Business Acumen & AI Integration",
          ar: "فطنة الأعمال ودمج الذكاء الاصطناعي",
        },
        desc: {
          en: "Use business acumen to understand the big picture of a company, turning technical data into strategic decisions. Integrate AI and API tools in data analytics.",
          ar: "توظيف فطنة الأعمال لفهم الصورة الكبرى للشركة وتحويل البيانات التقنية إلى قرارات استراتيجية. دمج أدوات الذكاء الاصطناعي وواجهات البرمجة في تحليل البيانات.",
        },
      },
      {
        title: {
          en: "Executive Data Communication",
          ar: "التواصل التنفيذي بالبيانات",
        },
        desc: {
          en: "Communicate data in a business context to generate actionable insights that influence decision-making at the executive level.",
          ar: "إيصال البيانات في سياق الأعمال بهدف توليد رؤى قابلة للتنفيذ تؤثر على اتخاذ القرار على المستوى التنفيذي.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "This course is perfect for mid-level professionals including data analysts, BI specialists, and business unit managers who have a foundational grasp of data and are ready to step up, influence decision-makers, and evolve into a true strategic business partner.",
      ar: "تعد هذه الدورة مثالية للمهنيين من المستوى المتوسط بما في ذلك محللي البيانات ومختصي ذكاء الأعمال ومديري وحدات الأعمال ممن لديهم أساس جيد في البيانات ويرغبون في التأثير على صناع القرار والتحول إلى شركاء أعمال استراتيجيين.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Data Analytics", ar: "تحليل البيانات" } },
      { text: { en: "Business Intelligence", ar: "ذكاء الأعمال" } },
      { text: { en: "Strategic Thinking", ar: "التفكير الاستراتيجي" } },
      { text: { en: "Problem Solving", ar: "حل المشكلات" } },
      { text: { en: "Business Acumen", ar: "فطنة الأعمال" } },
      { text: { en: "AI Integration", ar: "دمج الذكاء الاصطناعي" } },
      { text: { en: "Business Data Communication", ar: "التواصل بالبيانات في سياق الأعمال" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "5 Modules \u2022 20 Video Lessons \u2022 5 Days of Hands-On Training",
      ar: "5 وحدات \u2022 20 درس فيديو \u2022 5 أيام تدريب عملي",
    },
    modules: [
      {
        id: 1,
        title: { en: "Enterprise Advantage Through Data Analysis", ar: "الميزة المؤسسية من خلال تحليل البيانات" },
        videos: [
          { num: "1.1", title: { en: "Data Translation", ar: "ترجمة البيانات" }, desc: { en: "Learn how to translate raw data into business language that stakeholders can understand and act upon.", ar: "تعلم كيفية ترجمة البيانات الخام إلى لغة أعمال يمكن لأصحاب المصلحة فهمها والتصرف بناءً عليها." }, duration: "30 min" },
          { num: "1.2", title: { en: "Analytics Opportunities & Risk Identification", ar: "تحديد فرص التحليلات والمخاطر" }, desc: { en: "Identify analytics opportunities and risks within organizational data to drive strategic decision-making.", ar: "تحديد فرص التحليلات والمخاطر ضمن بيانات المؤسسة لتوجيه اتخاذ القرار الاستراتيجي." }, duration: "30 min" },
          { num: "1.3", title: { en: "Business Objectives, KPIs & Analytics Gap Bridging", ar: "أهداف الأعمال ومؤشرات الأداء والفجوات التحليلية" }, desc: { en: "Align analytics initiatives with business objectives, define KPIs, and bridge the gap between data insights and business goals.", ar: "مواءمة مبادرات التحليلات مع أهداف الأعمال وتحديد مؤشرات الأداء وسد الفجوة بين رؤى البيانات وأهداف الأعمال." }, duration: "30 min" },
          { num: "1.4", title: { en: "Data Evaluation & Reporting", ar: "تقييم البيانات وإعداد التقارير" }, desc: { en: "Evaluate data quality, reliability, and relevance, then create impactful reports that drive business value.", ar: "تقييم جودة البيانات وموثوقيتها وملاءمتها ثم إنشاء تقارير مؤثرة تحقق قيمة للأعمال." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Business Acumen & Decision Intelligence", ar: "فطنة الأعمال وذكاء القرار" },
        videos: [
          { num: "2.1", title: { en: "Understanding Core Business Models", ar: "فهم نماذج الأعمال الأساسية" }, desc: { en: "Master the fundamental business models and frameworks that drive organizational strategy and profitability.", ar: "إتقان نماذج وأطر الأعمال الأساسية التي تدفع الاستراتيجية المؤسسية والربحية." }, duration: "30 min" },
          { num: "2.2", title: { en: "Structured Decision-Making Frameworks", ar: "أطر اتخاذ القرار المنهجي" }, desc: { en: "Apply structured decision-making frameworks that combine data analysis with business judgment for optimal outcomes.", ar: "تطبيق أطر اتخاذ القرار المنهجي التي تجمع بين تحليل البيانات والحكم التجاري للحصول على نتائج مثالية." }, duration: "30 min" },
          { num: "2.3", title: { en: "Business Problem Statement Construction", ar: "صياغة بيان التحديات والمشاكل في بيئة العمل" }, desc: { en: "Construct clear, actionable business problem statements that guide BI initiatives and focus analytical efforts.", ar: "صياغة بيانات مشكلات أعمال واضحة وقابلة للتنفيذ توجه مبادرات ذكاء الأعمال وتركز الجهود التحليلية." }, duration: "30 min" },
          { num: "2.4", title: { en: "Strategic Thinking in Building Holistic Systems", ar: "التفكير الاستراتيجي لبناء أنظمة شاملة" }, desc: { en: "Develop strategic thinking skills to design holistic BI systems that integrate data across the enterprise.", ar: "تطوير مهارات التفكير الاستراتيجي لتصميم أنظمة ذكاء أعمال شاملة تدمج البيانات عبر المؤسسة." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Executive Communication with Data", ar: "التواصل التنفيذي باستخدام البيانات" },
        videos: [
          { num: "3.1", title: { en: "Business Context Communication", ar: "التواصل في سياق الأعمال" }, desc: { en: "Master the art of communicating data findings within a business context that resonates with executive audiences.", ar: "إتقان فن التواصل بنتائج البيانات ضمن سياق الأعمال بما يتناسب مع الجمهور التنفيذي." }, duration: "30 min" },
          { num: "3.2", title: { en: "Actionable Insights Transformation", ar: "تحويل البيانات إلى رؤى قابلة للتنفيذ" }, desc: { en: "Transform raw data analysis into actionable insights that directly inform business strategy and operations.", ar: "تحويل تحليل البيانات الخام إلى رؤى قابلة للتنفيذ تُوجه استراتيجية وعمليات الأعمال مباشرة." }, duration: "30 min" },
          { num: "3.3", title: { en: "Decision-Making Influence", ar: "التأثير في عملية اتخاذ القرار" }, desc: { en: "Build influence with decision-makers by presenting data-driven recommendations with clarity and confidence.", ar: "بناء التأثير مع صناع القرار من خلال تقديم توصيات مبنية على البيانات بوضوح وثقة." }, duration: "30 min" },
          { num: "3.4", title: { en: "Decision Data Support", ar: "دعم القرار بالبيانات" }, desc: { en: "Create comprehensive data support packages that provide decision-makers with the evidence they need.", ar: "إنشاء حزم دعم بيانات شاملة تزود صناع القرار بالأدلة التي يحتاجونها." }, duration: "30 min" },
        ],
      },
      {
        id: 4,
        title: { en: "AI Acumen & Integration", ar: "معرفة الذكاء الاصطناعي ودمجه في الأعمال" },
        videos: [
          { num: "4.1", title: { en: "Understanding AI in Business Environments", ar: "فهم استخدام الذكاء الاصطناعي في بيئة الأعمال" }, desc: { en: "Understand how AI is transforming business environments and identify opportunities for AI-driven improvements.", ar: "فهم كيف يحوّل الذكاء الاصطناعي بيئات الأعمال وتحديد فرص التحسين المدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "4.2", title: { en: "AI Tools Identification", ar: "تحديد أدوات الذكاء الاصطناعي" }, desc: { en: "Identify and evaluate the right AI tools for specific business use cases, balancing capability with practicality.", ar: "تحديد وتقييم أدوات الذكاء الاصطناعي المناسبة لحالات استخدام الأعمال المحددة مع التوازن بين القدرة والعملية." }, duration: "30 min" },
          { num: "4.3", title: { en: "Integrating AI Tools into Analytics", ar: "دمج أدوات الذكاء الاصطناعي في التحليلات" }, desc: { en: "Integrate AI tools into existing analytics workflows to enhance data processing, analysis, and insight generation.", ar: "دمج أدوات الذكاء الاصطناعي في سير عمل التحليلات الحالي لتعزيز معالجة البيانات والتحليل وتوليد الرؤى." }, duration: "30 min" },
          { num: "4.4", title: { en: "Automation with AI for Productivity", ar: "الأتمتة بالذكاء الاصطناعي لتعزيز الإنتاجية" }, desc: { en: "Leverage AI-powered automation to increase productivity and effectiveness in data analysis and reporting workflows.", ar: "الاستفادة من الأتمتة المدعومة بالذكاء الاصطناعي لزيادة الإنتاجية والفعالية في سير عمل تحليل البيانات والتقارير." }, duration: "30 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Value Enablement Data Architecture", ar: "هندسة البيانات لتمكين القيمة" },
        videos: [
          { num: "5.1", title: { en: "Data Pipelines Development", ar: "تطوير خطوط أنابيب البيانات" }, desc: { en: "Design and develop data pipelines that efficiently move and transform data from sources to analytical platforms.", ar: "تصميم وتطوير خطوط أنابيب البيانات التي تنقل وتحول البيانات بكفاءة من المصادر إلى المنصات التحليلية." }, duration: "30 min" },
          { num: "5.2", title: { en: "The ETL Process for Integration", ar: "عمليات الاستخراج والتحويل والتحميل للتكامل" }, desc: { en: "Master Extract, Transform, Load processes for integrating data from multiple sources into unified analytical systems.", ar: "إتقان عمليات الاستخراج والتحويل والتحميل لدمج البيانات من مصادر متعددة في أنظمة تحليلية موحدة." }, duration: "30 min" },
          { num: "5.3", title: { en: "ELT Approaches in Data Platforms", ar: "نهج ELT في منصات البيانات" }, desc: { en: "Explore ELT approaches in modern data platforms and understand when to use ELT versus traditional ETL.", ar: "استكشاف نهج ELT في منصات البيانات الحديثة وفهم متى يجب استخدام ELT مقابل ETL التقليدي." }, duration: "30 min" },
          { num: "5.4", title: { en: "Data Governance, Security & Quality", ar: "حوكمة البيانات والأمن والجودة" }, desc: { en: "Implement data governance frameworks, security controls, and quality assurance practices for enterprise data assets.", ar: "تطبيق أطر حوكمة البيانات وضوابط الأمن وممارسات ضمان الجودة لأصول بيانات المؤسسة." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CBACP — Certified Board Audit Committee Professional               */
  /* ------------------------------------------------------------------ */

  cbacp: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By completing this course, participants will be able to:",
      ar: "بعد إتمام حضور هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "Audit Committee Roles",
          ar: "أدوار لجان المراجعة",
        },
        desc: {
          en: "Identify the role and responsibilities of audit committees within corporate governance frameworks.",
          ar: "تحديد دور ومسؤوليات لجان المراجعة ضمن أطر الحوكمة المؤسسية.",
        },
      },
      {
        title: {
          en: "Internal & External Audit",
          ar: "المراجعة الداخلية والخارجية",
        },
        desc: {
          en: "Evaluate internal and external audit functions to ensure effective oversight and control.",
          ar: "تقييم وظائف المراجعة الداخلية والخارجية لضمان فعالية الإشراف والرقابة.",
        },
      },
      {
        title: {
          en: "Financial Statements Interpretation",
          ar: "تفسير القوائم المالية",
        },
        desc: {
          en: "Interpret financial statements and key disclosures from a governance perspective.",
          ar: "تفسير القوائم المالية والإفصاحات الرئيسية من منظور الحوكمة.",
        },
      },
      {
        title: {
          en: "Risk Management Assessment",
          ar: "تقييم إدارة المخاطر",
        },
        desc: {
          en: "Assess risk management systems and internal control environments.",
          ar: "تقييم أنظمة إدارة المخاطر وبيئات الرقابة الداخلية.",
        },
      },
      {
        title: {
          en: "Ethical Decision Quality",
          ar: "جودة القرارات الأخلاقية",
        },
        desc: {
          en: "Enhance the quality of ethical decisions within the board of directors.",
          ar: "تعزيز جودة القرارات الأخلاقية داخل مجلس الإدارة.",
        },
      },
      {
        title: {
          en: "International Standards Alignment",
          ar: "التوافق مع المعايير الدولية",
        },
        desc: {
          en: "Align audit committee practices with international governance standards.",
          ar: "مواءمة ممارسات لجان المراجعة مع المعايير الدولية للحوكمة.",
        },
      },
      {
        title: {
          en: "Compliance Oversight",
          ar: "الإشراف على الالتزام",
        },
        desc: {
          en: "Oversee compliance programs and emerging regulatory requirements.",
          ar: "الإشراف على برامج الالتزام والمتطلبات التنظيمية المستجدة.",
        },
      },
      {
        title: {
          en: "Stakeholder Transparency",
          ar: "الشفافية مع أصحاب المصلحة",
        },
        desc: {
          en: "Enhance transparency and communication quality with key stakeholders.",
          ar: "تعزيز الشفافية وجودة التواصل مع أصحاب المصلحة الرئيسيين.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "Current or prospective board members, audit committee chairs and members, senior executives such as CEOs, CFOs, risk and compliance officers, corporate governance leaders, board secretaries, internal audit directors, external auditors, and legal and governance consultants.",
      ar: "أعضاء مجالس الإدارة وأعضاء ورؤساء لجان المراجعة الحاليين أو المرشحين، إضافة إلى القيادات التنفيذية العليا مثل الرؤساء التنفيذيين والمديرين الماليين ومديري المخاطر والالتزام، وقادة الحوكمة المؤسسية وأمناء مجالس الإدارة، ومديري المراجعة الداخلية والمدققين الخارجيين، والمستشارين القانونيين ومستشاري الحوكمة.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Corporate Governance Foundations", ar: "أسس الحوكمة المؤسسية" } },
      { text: { en: "Audit Committee Leadership", ar: "قيادة لجان المراجعة" } },
      { text: { en: "Financial Oversight Practices", ar: "ممارسات الإشراف المالي" } },
      { text: { en: "Risk and Control Governance", ar: "حوكمة المخاطر والضوابط" } },
      { text: { en: "Regulatory and Compliance Insight", ar: "الفهم التنظيمي والالتزام" } },
      { text: { en: "Ethical and Strategic Decision-Making", ar: "اتخاذ القرار الأخلاقي والاستراتيجي" } },
      { text: { en: "Stakeholder Reporting and Transparency", ar: "التقارير والشفافية لأصحاب المصلحة" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "7 Modules • 35 Video Lessons • 5 Days of Hands-On Training",
      ar: "7 وحدات • 35 درس فيديو • 5 أيام تدريب عملي",
    },
    modules: [
      {
        id: 1,
        title: { en: "Corporate Governance Foundations", ar: "أسس الحوكمة المؤسسية" },
        videos: [
          { num: "1.1", title: { en: "Governance Structures & Board Roles", ar: "هياكل الحوكمة وأدوار مجالس الإدارة" }, desc: { en: "Understand governance structures and the distinct roles boards play in organizational oversight.", ar: "فهم هياكل الحوكمة وأدوار مجالس الإدارة في الإشراف المؤسسي." }, duration: "25 min" },
          { num: "1.2", title: { en: "Audit Committee in the Governance Ecosystem", ar: "لجنة المراجعة ضمن منظومة الحوكمة" }, desc: { en: "Position the audit committee within the broader governance ecosystem and its interrelationships.", ar: "موقع لجنة المراجعة ضمن منظومة الحوكمة وعلاقاتها المتبادلة." }, duration: "25 min" },
          { num: "1.3", title: { en: "Accountability, Transparency & Integrity", ar: "المساءلة والشفافية والنزاهة" }, desc: { en: "Explore the foundational principles of accountability, transparency, and integrity in governance.", ar: "استكشاف مبادئ المساءلة والشفافية والنزاهة الأساسية في الحوكمة." }, duration: "25 min" },
          { num: "1.4", title: { en: "Global Governance Frameworks", ar: "أطر الحوكمة العالمية" }, desc: { en: "Review global governance frameworks including OECD, COSO, and IIA Standards.", ar: "استعراض أطر الحوكمة العالمية: OECD وCOSO ومعايير IIA." }, duration: "25 min" },
          { num: "1.5", title: { en: "Board vs. Management vs. Audit Responsibilities", ar: "مسؤوليات المجلس والإدارة والمراجعة" }, desc: { en: "Distinguish between board, management, and audit responsibilities for effective governance.", ar: "التمييز بين مسؤوليات المجلس والإدارة والمراجعة لضمان حوكمة فعالة." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Audit Committee Leadership", ar: "قيادة لجان المراجعة" },
        videos: [
          { num: "2.1", title: { en: "Leadership Role & Strategic Responsibilities", ar: "الدور القيادي والمسؤوليات الاستراتيجية" }, desc: { en: "Define the leadership role and strategic responsibilities of the audit committee.", ar: "تحديد الدور القيادي والمسؤوليات الاستراتيجية للجنة المراجعة." }, duration: "25 min" },
          { num: "2.2", title: { en: "Effective Charters & Scheduling", ar: "مواثيق العمل الفعّالة وجدولة الأعمال" }, desc: { en: "Build effective charters and schedule committee work for optimal governance impact.", ar: "بناء مواثيق عمل فعّالة وجدولة أعمال اللجنة لتحقيق أفضل أثر حوكمي." }, duration: "25 min" },
          { num: "2.3", title: { en: "Decision-Making & Board Collaboration", ar: "اتخاذ القرار والتعاون داخل المجلس" }, desc: { en: "Navigate decision-making dynamics and collaboration within the board of directors.", ar: "ديناميكيات اتخاذ القرار والتعاون داخل مجلس الإدارة." }, duration: "25 min" },
          { num: "2.4", title: { en: "Skills for Successful Committee Members", ar: "مهارات أعضاء اللجان الناجحين" }, desc: { en: "Identify the essential skills and attributes for successful audit committee members.", ar: "المهارات والسمات الأساسية لأعضاء لجان المراجعة الناجحين." }, duration: "25 min" },
          { num: "2.5", title: { en: "Effective Chairmanship & Stakeholder Engagement", ar: "فاعلية رئاسة اللجنة والتفاعل مع أصحاب المصلحة" }, desc: { en: "Master effective committee chairmanship and stakeholder engagement techniques.", ar: "فاعلية رئاسة اللجنة والتفاعل مع أصحاب المصلحة." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Financial Oversight Practices", ar: "ممارسات الإشراف المالي" },
        videos: [
          { num: "3.1", title: { en: "Financial Statements & Material Disclosures", ar: "القوائم المالية والإفصاحات الجوهرية" }, desc: { en: "Review financial statements and material disclosures with a governance lens.", ar: "مراجعة القوائم المالية والإفصاحات الجوهرية من منظور الحوكمة." }, duration: "25 min" },
          { num: "3.2", title: { en: "Accounting Judgments & Estimates", ar: "الأحكام والتقديرات المحاسبية" }, desc: { en: "Evaluate accounting judgments and estimates for reasonableness and compliance.", ar: "تقييم الأحكام والتقديرات المحاسبية من حيث المعقولية والامتثال." }, duration: "25 min" },
          { num: "3.3", title: { en: "External Audit Quality & Independence", ar: "جودة واستقلالية المراجعة الخارجية" }, desc: { en: "Ensure external audit quality and independence through effective oversight mechanisms.", ar: "ضمان جودة واستقلالية المراجعة الخارجية من خلال آليات إشراف فعالة." }, duration: "25 min" },
          { num: "3.4", title: { en: "Earnings Management Detection", ar: "رصد إدارة الأرباح" }, desc: { en: "Detect indicators of earnings management or financial misstatement.", ar: "رصد مؤشرات إدارة الأرباح أو التحريف المالي." }, duration: "25 min" },
          { num: "3.5", title: { en: "Financial Integrity Assessment", ar: "تقييم النزاهة المالية" }, desc: { en: "Assess financial integrity using key indicators and trend analysis.", ar: "تقييم النزاهة المالية باستخدام المؤشرات والاتجاهات." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Risk and Control Governance", ar: "حوكمة المخاطر والضوابط" },
        videos: [
          { num: "4.1", title: { en: "Risk Management & Strategic Oversight", ar: "إدارة المخاطر والإشراف الاستراتيجي" }, desc: { en: "Link risk management to the board's strategic oversight responsibilities.", ar: "ربط إدارة المخاطر بالإشراف الاستراتيجي لمجلس الإدارة." }, duration: "25 min" },
          { num: "4.2", title: { en: "Internal Control & Lines of Assurance", ar: "الرقابة الداخلية وخطوط التأكيد" }, desc: { en: "Understand internal control frameworks and lines of assurance models.", ar: "فهم أطر الرقابة الداخلية وخطوط التأكيد." }, duration: "25 min" },
          { num: "4.3", title: { en: "Risk Appetite & Tolerance Levels", ar: "شهية المخاطر ومستويات التحمل" }, desc: { en: "Review risk appetite and tolerance levels at the board level for informed decision-making.", ar: "مراجعة شهية المخاطر ومستويات التحمل على مستوى المجلس." }, duration: "25 min" },
          { num: "4.4", title: { en: "Evaluating Audit Reports", ar: "تقييم تقارير المراجعة" }, desc: { en: "Evaluate internal and external audit reports for completeness and actionability.", ar: "تقييم تقارير المراجعة الداخلية والخارجية." }, duration: "25 min" },
          { num: "4.5", title: { en: "Continuous Control Improvement", ar: "التحسين المستمر للضوابط" }, desc: { en: "Ensure continuous improvement in control effectiveness across the organization.", ar: "ضمان التحسين المستمر في فعالية الضوابط." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Regulatory and Compliance Insight", ar: "الفهم التنظيمي والالتزام" },
        videos: [
          { num: "5.1", title: { en: "Regulatory Frameworks for Audit Committees", ar: "الأطر التنظيمية للجان المراجعة" }, desc: { en: "Analyze key regulatory frameworks affecting audit committees globally.", ar: "تحليل الأطر التنظيمية الرئيسية المؤثرة على لجان المراجعة." }, duration: "25 min" },
          { num: "5.2", title: { en: "Compliance & Statutory Reporting", ar: "الالتزام والتقارير النظامية" }, desc: { en: "Monitor compliance regimes and statutory reporting requirements.", ar: "متابعة أنظمة الالتزام ومتطلبات التقارير النظامية." }, duration: "25 min" },
          { num: "5.3", title: { en: "Whistleblowing & Investigation Mechanisms", ar: "الإبلاغ عن المخالفات والتحقيق" }, desc: { en: "Understand whistleblowing, investigation, and remediation mechanisms.", ar: "فهم آليات الإبلاغ عن المخالفات، والتحقيق، والمعالجة." }, duration: "25 min" },
          { num: "5.4", title: { en: "Anti-Corruption & AML Programs", ar: "برامج مكافحة الفساد وغسل الأموال" }, desc: { en: "Oversee anti-corruption and anti-money laundering programs.", ar: "الإشراف على برامج مكافحة الفساد وغسل الأموال." }, duration: "25 min" },
          { num: "5.5", title: { en: "ESG & AI Governance Challenges", ar: "تحديات حوكمة ESG والذكاء الاصطناعي" }, desc: { en: "Anticipate governance challenges arising from ESG and AI regulations.", ar: "استشراف تحديات الحوكمة الناتجة عن تشريعات الاستدامة (ESG) والذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Ethical and Strategic Decision-Making", ar: "اتخاذ القرار الأخلاقي والاستراتيجي" },
        videos: [
          { num: "6.1", title: { en: "Ethical Judgment in Board Deliberations", ar: "الحكم الأخلاقي في مداولات المجلس" }, desc: { en: "Embed ethical judgment in board deliberations and governance processes.", ar: "ترسيخ الحكم الأخلاقي في مداولات مجلس الإدارة." }, duration: "25 min" },
          { num: "6.2", title: { en: "Fiduciary Duty & Sustainability", ar: "الواجب الائتماني والاستدامة" }, desc: { en: "Balance fiduciary duty with organizational sustainability for long-term value.", ar: "الموازنة بين الواجب الائتماني واستدامة المؤسسة." }, duration: "25 min" },
          { num: "6.3", title: { en: "Conflict of Interest Management", ar: "إدارة تضارب المصالح" }, desc: { en: "Manage conflicts of interest with transparency and accountability.", ar: "إدارة تضارب المصالح بشفافية ومسؤولية." }, duration: "25 min" },
          { num: "6.4", title: { en: "Governance & Strategic Value Creation", ar: "الحوكمة وخلق القيمة الاستراتيجية" }, desc: { en: "Align governance with long-term strategic value creation for all stakeholders.", ar: "مواءمة الحوكمة مع خلق القيمة الاستراتيجية طويلة الأجل." }, duration: "25 min" },
          { num: "6.5", title: { en: "Decision Quality Under Uncertainty", ar: "جودة القرارات في بيئات عدم اليقين" }, desc: { en: "Improve decision quality under conditions of uncertainty and complexity.", ar: "تحسين جودة القرارات في بيئات عدم اليقين." }, duration: "25 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Stakeholder Reporting and Transparency", ar: "التقارير والشفافية لأصحاب المصلحة" },
        videos: [
          { num: "7.1", title: { en: "Board & Audit Committee Reporting", ar: "تقارير مجالس الإدارة ولجان المراجعة" }, desc: { en: "Apply best practices in board and audit committee reporting for governance excellence.", ar: "أفضل الممارسات في تقارير مجالس الإدارة ولجان المراجعة." }, duration: "25 min" },
          { num: "7.2", title: { en: "Communicating Audit Findings", ar: "إيصال نتائج المراجعة" }, desc: { en: "Communicate audit findings to shareholders and regulatory authorities effectively.", ar: "إيصال نتائج أعمال المراجعة للمساهمين والجهات التنظيمية." }, duration: "25 min" },
          { num: "7.3", title: { en: "Annual Report Disclosures", ar: "إفصاحات التقارير السنوية" }, desc: { en: "Prepare impactful audit committee disclosures for annual reports.", ar: "إعداد إفصاحات مؤثرة للجنة المراجعة في التقارير السنوية." }, duration: "25 min" },
          { num: "7.4", title: { en: "Public Trust & Corporate Reputation", ar: "الثقة العامة والسمعة المؤسسية" }, desc: { en: "Manage public trust and corporate reputation through transparent governance.", ar: "إدارة الثقة العامة والسمعة المؤسسية." }, duration: "25 min" },
          { num: "7.5", title: { en: "ESG Reporting & Sustainability Assurance", ar: "تقارير الاستدامة وضمانات ESG" }, desc: { en: "Integrate sustainability reporting oversight and ESG assurance into governance practices.", ar: "دمج الإشراف على تقارير الاستدامة وضمانات ESG." }, duration: "25 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CAFA — Certified AI Financial Analyst                              */
  /* ------------------------------------------------------------------ */

  cafa: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By completing this course, participants will be able to:",
      ar: "بعد إتمام حضور هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: {
          en: "AI-Powered Financial Analysis",
          ar: "التحليل المالي بالذكاء الاصطناعي",
        },
        desc: {
          en: "Analyze financial statements using Microsoft Copilot AI capabilities within Excel.",
          ar: "تحليل القوائم المالية باستخدام إمكانات Copilot داخل Excel.",
        },
      },
      {
        title: {
          en: "Smart Financial Review",
          ar: "المراجعة المالية الذكية",
        },
        desc: {
          en: "Simplify income statement, balance sheet, and cash flow statement reviews through intelligent automation.",
          ar: "تبسيط مراجعة قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية من خلال الأتمتة الذكية.",
        },
      },
      {
        title: {
          en: "AI-Driven Financial Ratios",
          ar: "النسب المالية المدعومة بالذكاء الاصطناعي",
        },
        desc: {
          en: "Prepare AI-supported financial indicators and ratios for deeper analysis.",
          ar: "إعداد مؤشرات ونسب مالية مدعومة بالذكاء الاصطناعي.",
        },
      },
      {
        title: {
          en: "Predictive Financial Analysis",
          ar: "التحليل المالي التنبئي",
        },
        desc: {
          en: "Extract financial patterns and trends using predictive analysis capabilities.",
          ar: "استخلاص الأنماط والاتجاهات المالية اعتمادًا على قدرات التحليل التنبئي.",
        },
      },
      {
        title: {
          en: "AI-Based Decision Support",
          ar: "دعم القرار بالذكاء الاصطناعي",
        },
        desc: {
          en: "Support management decisions through AI-powered financial analytics.",
          ar: "دعم القرارات الإدارية عبر تحليلات مالية قائمة على الذكاء الاصطناعي.",
        },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "Financial analysts and FP&A teams, management accountants and financial controllers, finance managers and decision-makers, business analysts and corporate planners, and professionals seeking to integrate AI into the financial domain.",
      ar: "محللو المالية وفرق التخطيط والتحليل المالي FP&A، المحاسبون الإداريون ومديرو الرقابة المالية، مديرو المالية ومتخذو القرار، محللو الأعمال ومخططو الشركات، والمهنيون الراغبون في دمج الذكاء الاصطناعي في المجال المالي.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Financial Statements with Copilot AI", ar: "مقدمة حول القوائم المالية باستخدام Copilot AI" } },
      { text: { en: "Income Statement Analysis with Copilot AI", ar: "Copilot AI في تحليل قائمة الدخل" } },
      { text: { en: "Balance Sheet Analysis with Copilot AI", ar: "Copilot AI في تحليل الميزانية العمومية" } },
      { text: { en: "Cash Flow Analysis with Copilot AI", ar: "Copilot AI في تحليل التدفقات النقدية" } },
      { text: { en: "Financial Ratio Analysis with Copilot AI", ar: "Copilot AI في تحليل النسب المالية" } },
      { text: { en: "Performance Evaluation with Copilot AI", ar: "Copilot AI في تقييم الأداء وتحليل الاتجاهات" } },
      { text: { en: "Financial Decision Support with Copilot AI", ar: "Copilot AI في دعم اتخاذ القرارات المالية" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "7 Modules • 35 Video Lessons • 5 Days of Hands-On Training",
      ar: "7 وحدات • 35 درس فيديو • 5 أيام تدريب عملي",
    },
    prerequisiteNote: {
      en: "This course requires a laptop with Microsoft Excel 2019/365 and Microsoft Copilot AI enabled.",
      ar: "يتطلب هذا البرنامج جهاز حاسوب محمول مع Microsoft Excel 2019/365 وميزة Microsoft Copilot AI.",
    },
    modules: [
      {
        id: 1,
        title: { en: "Financial Statements with Copilot AI", ar: "مقدمة القوائم المالية باستخدام Copilot AI" },
        videos: [
          { num: "1.1", title: { en: "Financial Statements Overview", ar: "نظرة عامة على القوائم المالية" }, desc: { en: "Comprehensive overview of financial statements and their role in business analysis.", ar: "نظرة عامة شاملة على القوائم المالية ودورها في تحليل الأعمال." }, duration: "25 min" },
          { num: "1.2", title: { en: "Components of Financial Statements", ar: "مكونات القوائم المالية" }, desc: { en: "Explore the key components that make up a complete set of financial statements.", ar: "استكشاف المكونات الرئيسية التي تشكل مجموعة كاملة من القوائم المالية." }, duration: "25 min" },
          { num: "1.3", title: { en: "AI-Supported Revenue & Expense Data", ar: "بيانات الإيرادات والمصروفات بدعم الذكاء الاصطناعي" }, desc: { en: "Leverage AI to analyze and validate revenue and expense data for accuracy.", ar: "الاستفادة من الذكاء الاصطناعي في تحليل والتحقق من بيانات الإيرادات والمصروفات." }, duration: "25 min" },
          { num: "1.4", title: { en: "Quick Financial Summaries & Indicators", ar: "ملخصات سريعة للنتائج والمؤشرات المالية" }, desc: { en: "Generate quick summaries of financial results and key indicators using Copilot AI.", ar: "إنشاء ملخصات سريعة للنتائج والمؤشرات المالية باستخدام Copilot AI." }, duration: "25 min" },
          { num: "1.5", title: { en: "Linking Income, Balance Sheet & Cash Flow", ar: "الربط بين الدخل والميزانية والتدفقات النقدية" }, desc: { en: "Understand the interconnections between income statements, balance sheets, and cash flow statements.", ar: "فهم العلاقات المتبادلة بين قائمة الدخل والميزانية والتدفقات النقدية." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Copilot AI in Income Statement Analysis", ar: "Copilot AI في تحليل قائمة الدخل" },
        videos: [
          { num: "2.1", title: { en: "AI-Powered Revenue & Cost Analysis", ar: "الإيرادات والتكاليف بدعم الذكاء الاصطناعي" }, desc: { en: "Analyze revenues and costs using AI-powered tools for deeper insights.", ar: "تحليل الإيرادات والتكاليف باستخدام أدوات مدعومة بالذكاء الاصطناعي." }, duration: "25 min" },
          { num: "2.2", title: { en: "Cost of Sales & Expenses", ar: "تكاليف المبيعات والمصروفات" }, desc: { en: "Examine cost of sales and operating expenses with AI-assisted analysis.", ar: "فحص تكاليف المبيعات والمصروفات التشغيلية بمساعدة الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "2.3", title: { en: "Margins & Profitability Analysis", ar: "الهوامش والربحية" }, desc: { en: "Calculate and interpret margins and profitability metrics using Copilot AI.", ar: "حساب وتفسير الهوامش ومقاييس الربحية باستخدام Copilot AI." }, duration: "25 min" },
          { num: "2.4", title: { en: "Operating & Non-Operating Performance", ar: "الأداء التشغيلي وغير التشغيلي" }, desc: { en: "Distinguish and analyze operating vs. non-operating performance components.", ar: "التمييز بين الأداء التشغيلي وغير التشغيلي وتحليلهما." }, duration: "25 min" },
          { num: "2.5", title: { en: "AI-Supported Income Statement Case Study", ar: "دراسة تطبيقية على قائمة دخل بالذكاء الاصطناعي" }, desc: { en: "Apply AI-powered analysis to a comprehensive income statement case study.", ar: "تطبيق التحليل المدعوم بالذكاء الاصطناعي على دراسة حالة شاملة لقائمة الدخل." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Copilot AI in Balance Sheet Analysis", ar: "Copilot AI في تحليل الميزانية العمومية" },
        videos: [
          { num: "3.1", title: { en: "Assets, Liabilities & Equity Structure", ar: "هيكل الأصول والالتزامات وحقوق الملكية" }, desc: { en: "Analyze the structure of assets, liabilities, and equity components.", ar: "تحليل هيكل الأصول والالتزامات وحقوق الملكية." }, duration: "25 min" },
          { num: "3.2", title: { en: "Current & Non-Current Items", ar: "العناصر المتداولة وغير المتداولة" }, desc: { en: "Classify and evaluate current and non-current balance sheet items.", ar: "تصنيف وتقييم العناصر المتداولة وغير المتداولة." }, duration: "25 min" },
          { num: "3.3", title: { en: "Depreciation & Amortization Schedules", ar: "جداول الاستهلاك والإطفاء" }, desc: { en: "Manage depreciation and amortization schedules for accurate financial reporting.", ar: "إدارة جداول الاستهلاك والإطفاء لإعداد تقارير مالية دقيقة." }, duration: "25 min" },
          { num: "3.4", title: { en: "Debt & Financing Structure", ar: "هيكل الديون والتمويل" }, desc: { en: "Evaluate debt and financing structures for financial health assessment.", ar: "تقييم هيكل الديون والتمويل لتقدير الصحة المالية." }, duration: "25 min" },
          { num: "3.5", title: { en: "Financial Position & Solvency with Copilot", ar: "المركز المالي والملاءة بدعم Copilot" }, desc: { en: "Assess overall financial position and solvency using Copilot AI-powered analysis.", ar: "عرض شامل للمركز المالي والملاءة بدعم Copilot." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Copilot AI in Cash Flow Analysis", ar: "Copilot AI في تحليل التدفقات النقدية" },
        videos: [
          { num: "4.1", title: { en: "Operating, Investing & Financing Flows", ar: "التدفقات التشغيلية والاستثمارية والتمويلية" }, desc: { en: "Analyze operating, investing, and financing cash flows comprehensively.", ar: "تحليل التدفقات التشغيلية والاستثمارية والتمويلية بشكل شامل." }, duration: "25 min" },
          { num: "4.2", title: { en: "Accounting Profit vs. Cash Flow", ar: "الربح المحاسبي والتدفق النقدي" }, desc: { en: "Differentiate between accounting profit and actual cash flow for better analysis.", ar: "التمييز بين الربح المحاسبي والتدفق النقدي الفعلي." }, duration: "25 min" },
          { num: "4.3", title: { en: "Direct & Indirect Methods Simplified", ar: "الطريقة المباشرة وغير المباشرة بشكل مبسّط" }, desc: { en: "Understand direct and indirect methods of cash flow preparation in simplified terms.", ar: "فهم الطريقة المباشرة وغير المباشرة لإعداد التدفقات النقدية بشكل مبسّط." }, duration: "25 min" },
          { num: "4.4", title: { en: "Cash Movement & Financial Reconciliation", ar: "حركة النقد والتسوية المالية" }, desc: { en: "Track cash movements and perform financial reconciliation using AI tools.", ar: "تتبع حركة النقد وإجراء التسوية المالية باستخدام أدوات الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "4.5", title: { en: "AI-Powered Cash Flow Overview", ar: "عرض شامل للتدفقات النقدية بالذكاء الاصطناعي" }, desc: { en: "Generate a comprehensive AI-powered cash flow overview and analysis.", ar: "عرض شامل للتدفقات النقدية مدعومة بالذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Copilot AI in Financial Ratio Analysis", ar: "Copilot AI في تحليل النسب المالية" },
        videos: [
          { num: "5.1", title: { en: "Financial Ratios & Interpretation", ar: "النسب المالية وتفسيرها" }, desc: { en: "Calculate and interpret key financial ratios for business performance evaluation.", ar: "حساب وتفسير النسب المالية الرئيسية لتقييم أداء الأعمال." }, duration: "25 min" },
          { num: "5.2", title: { en: "Liquidity, Profitability, Solvency & Market Ratios", ar: "نسب السيولة والربحية والملاءة والسوق" }, desc: { en: "Master the four main ratio groups: liquidity, profitability, solvency, and market ratios.", ar: "إتقان مجموعات النسب الأساسية: السيولة، الربحية، الملاءة، والسوق." }, duration: "25 min" },
          { num: "5.3", title: { en: "Interactive Dashboard Integration", ar: "دمج النسب مع لوحات مؤشرات تفاعلية" }, desc: { en: "Integrate financial ratios with interactive dashboards for dynamic reporting.", ar: "إدماج النسب مع لوحات مؤشرات تفاعلية للتقارير الديناميكية." }, duration: "25 min" },
          { num: "5.4", title: { en: "Period-Over-Period Comparisons", ar: "المقارنات بين الفترات المالية" }, desc: { en: "Perform period-over-period financial comparisons for trend identification.", ar: "إجراء مقارنات بين الفترات المالية لتحديد الاتجاهات." }, duration: "25 min" },
          { num: "5.5", title: { en: "AI-Powered Financial Performance Reports", ar: "تقارير أداء مالية بالذكاء الاصطناعي" }, desc: { en: "Generate AI-powered financial performance reports for stakeholder communication.", ar: "إنشاء تقارير أداء مالية مدعومة بالذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Copilot AI in Performance Evaluation & Trend Analysis", ar: "Copilot AI في تقييم الأداء وتحليل الاتجاهات" },
        videos: [
          { num: "6.1", title: { en: "Comparative & Common-Size Analysis", ar: "التحليل المقارن وتحليل الحجم المشترك" }, desc: { en: "Apply comparative analysis and common-size analysis techniques for benchmarking.", ar: "تطبيق التحليل المقارن وتحليل الحجم المشترك للمقارنة المرجعية." }, duration: "25 min" },
          { num: "6.2", title: { en: "Horizontal & Vertical Analysis", ar: "التحليل الأفقي والرأسي" }, desc: { en: "Conduct horizontal and vertical analysis to identify performance trends.", ar: "إجراء التحليل الأفقي والرأسي لتحديد اتجاهات الأداء." }, duration: "25 min" },
          { num: "6.3", title: { en: "Detecting Material Performance Shifts", ar: "اكتشاف التحولات الجوهرية في الأداء" }, desc: { en: "Detect material shifts in financial performance using AI pattern recognition.", ar: "اكتشاف التحولات الجوهرية في الأداء باستخدام التعرف على الأنماط بالذكاء الاصطناعي." }, duration: "25 min" },
          { num: "6.4", title: { en: "Highlighting Anomalies & Inconsistencies", ar: "إبراز العناصر غير الطبيعية" }, desc: { en: "Highlight abnormal or inconsistent elements in financial data for further investigation.", ar: "إبراز العناصر غير الطبيعية أو غير المتسقة في البيانات المالية." }, duration: "25 min" },
          { num: "6.5", title: { en: "Practical Applications with Real Company Data", ar: "تطبيقات عملية ببيانات شركات حقيقية" }, desc: { en: "Apply practical analysis using real company data and AI-powered tools.", ar: "تطبيقات عملية باستخدام بيانات شركات حقيقية وأدوات الذكاء الاصطناعي." }, duration: "30 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Copilot AI in Financial Decision Support", ar: "Copilot AI في دعم اتخاذ القرارات المالية" },
        videos: [
          { num: "7.1", title: { en: "AI in Cost & Investment Analysis", ar: "الذكاء الاصطناعي في تحليل التكلفة والاستثمار" }, desc: { en: "Apply AI to cost analysis and investment evaluation for informed decisions.", ar: "تطبيق الذكاء الاصطناعي في تحليل التكلفة والاستثمار لاتخاذ قرارات مستنيرة." }, duration: "25 min" },
          { num: "7.2", title: { en: "Capital Project Evaluation with Copilot", ar: "تقييم المشاريع الرأسمالية بنماذج Copilot" }, desc: { en: "Evaluate capital projects using Copilot AI models for comprehensive assessment.", ar: "تقييم المشاريع الرأسمالية باستخدام نماذج Copilot للتقييم الشامل." }, duration: "25 min" },
          { num: "7.3", title: { en: "Valuations & Returns Analysis", ar: "التقييمات والعوائد" }, desc: { en: "Perform valuations and returns analysis using AI-enhanced financial models.", ar: "إجراء التقييمات وتحليل العوائد باستخدام نماذج مالية معززة بالذكاء الاصطناعي." }, duration: "25 min" },
          { num: "7.4", title: { en: "Financial Risks & Scenarios", ar: "المخاطر والسيناريوهات المالية" }, desc: { en: "Analyze financial risks and evaluate multiple scenarios for risk mitigation.", ar: "تحليل المخاطر المالية وتقييم السيناريوهات المتعددة للتخفيف من المخاطر." }, duration: "25 min" },
          { num: "7.5", title: { en: "End-to-End Financial Analysis Case Study", ar: "دراسة حالة شاملة للتحليل المالي" }, desc: { en: "Complete an end-to-end financial analysis case study using Copilot AI tools.", ar: "دراسة حالة شاملة للتحليل المالي من البداية للنهاية باستخدام أدوات Copilot AI." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CFMA — Cash Flow Management & Analysis, AI in Practice             */
  /* ------------------------------------------------------------------ */

  cfma: {
    objectivesTitle: {
      en: "Course Objectives",
      ar: "أهداف الدورة",
    },
    objectivesIntro: {
      en: "By completing this course, participants will be able to:",
      ar: "بعد إتمام حضور هذه الدورة، سيتمكن المشاركون من:",
    },
    objectives: [
      {
        title: { en: "Financial Statement Linkages", ar: "الترابط بين القوائم المالية" },
        desc: { en: "Interpret the interconnections between different financial statements.", ar: "تفسير الترابط بين القوائم المالية المختلفة." },
      },
      {
        title: { en: "Cash Flow Analysis Skills", ar: "مهارات تحليل التدفقات النقدية" },
        desc: { en: "Enhance cash flow statement analysis capabilities for better financial insights.", ar: "تعزيز مهارات تحليل قائمة التدفقات النقدية." },
      },
      {
        title: { en: "Working Capital Management", ar: "إدارة رأس المال العامل" },
        desc: { en: "Understand the relationship between cash and working capital and improve management strategies.", ar: "فهم العلاقة بين النقد ورأس المال العامل وتحسين استراتيجيات الإدارة." },
      },
      {
        title: { en: "Cash Flow Forecasting", ar: "التنبؤ بالتدفقات النقدية" },
        desc: { en: "Apply cash flow forecasting techniques including AI-supported predictions.", ar: "تطبيق تقنيات التنبؤ بالتدفقات النقدية بما في ذلك التوقعات المدعومة بالذكاء الاصطناعي." },
      },
      {
        title: { en: "Cash Flow Statement Preparation", ar: "إعداد قائمة التدفقات النقدية" },
        desc: { en: "Prepare cash flow statements and accurate cash forecasts with AI assistance.", ar: "إعداد قائمة التدفقات النقدية وتوقعات نقدية بدقة أعلى مدعومة بالذكاء الاصطناعي." },
      },
    ],
    audienceTitle: {
      en: "Target Audience",
      ar: "الفئة المستهدفة",
    },
    audienceDesc: {
      en: "Treasury officers, business activity managers, supply chain and procurement specialists, accounts receivable and payable teams, planning and budgeting specialists, financial and management accountants, capital investment analysts, and project finance team members seeking to integrate AI tools into cash flow and working capital management.",
      ar: "موظفو الخزينة، ومديرو الأنشطة التجارية، ومتخصصو سلاسل الإمداد والمشتريات، وفرق الحسابات المدينة والدائنة، وأخصائيو التخطيط وإعداد الموازنات، والمحاسبون الماليون والإداريون، ومحللو الاستثمارات الرأسمالية، وأعضاء فرق تمويل المشاريع، ممن يسعون إلى دمج الأدوات التحليلية الحديثة والحلول المدعومة بالذكاء الاصطناعي في إدارة التدفقات النقدية ورأس المال العامل.",
    },
    competenciesTitle: {
      en: "Target Competencies",
      ar: "الكفاءات المستهدفة",
    },
    competencies: [
      { text: { en: "Understanding Financial Statement Linkages", ar: "فهم الترابط بين القوائم المالية" } },
      { text: { en: "Clear Articulation of Cash Flow Information", ar: "العرض الواضح لمعلومات التدفقات النقدية" } },
      { text: { en: "Effective Working Capital Oversight", ar: "الإشراف الفعّال على رأس المال العامل" } },
      { text: { en: "Techniques for Enhancing Cash Liquidity", ar: "تقنيات تعزيز السيولة النقدية" } },
      { text: { en: "AI-Supported Cash Flow Trend Interpretation", ar: "تفسير اتجاهات التدفقات النقدية باستخدام الذكاء الاصطناعي" } },
      { text: { en: "AI-Assisted Forecasting & Scenario Analysis", ar: "التنبؤ وتحليل السيناريوهات المدعوم بالذكاء الاصطناعي" } },
      { text: { en: "Leveraging AI for Financial Decision-Making", ar: "توظيف أدوات الذكاء الاصطناعي لتعزيز جودة القرارات المالية" } },
    ],
    contentTitle: {
      en: "Course Content",
      ar: "محتوى الدورة",
    },
    contentSubtitle: {
      en: "7 Modules • 35 Video Lessons • 5 Days of Hands-On Training",
      ar: "7 وحدات • 35 درس فيديو • 5 أيام تدريب عملي",
    },
    modules: [
      {
        id: 1,
        title: { en: "Understanding Financial Statement Linkages", ar: "فهم الترابط بين القوائم المالية" },
        videos: [
          { num: "1.1", title: { en: "Income Statement, Balance Sheet & Cash Flow Interrelationships", ar: "العلاقات المتبادلة بين القوائم المالية" }, desc: { en: "Explore the interrelationships between income statements, balance sheets, and cash flow statements.", ar: "استكشاف العلاقات المتبادلة بين قائمة الدخل والميزانية العمومية وقائمة التدفقات النقدية." }, duration: "25 min" },
          { num: "1.2", title: { en: "Cash Basis vs. Accrual Basis", ar: "الأساس النقدي وأساس الاستحقاق" }, desc: { en: "Understand the differences between cash basis and accrual basis accounting.", ar: "فهم الفروقات بين الأساس النقدي وأساس الاستحقاق." }, duration: "25 min" },
          { num: "1.3", title: { en: "Profitability vs. Cash Flow", ar: "الربحية والتدفق النقدي" }, desc: { en: "Distinguish between profitability and cash flow in performance evaluation.", ar: "التمييز بين الربحية والتدفق النقدي في تقييم الأداء." }, duration: "25 min" },
          { num: "1.4", title: { en: "Cash Pressure Indicators", ar: "مؤشرات الضغط النقدي" }, desc: { en: "Identify cash pressure indicators across financial statements.", ar: "رصد مؤشرات الضغط النقدي عبر القوائم المالية." }, duration: "25 min" },
          { num: "1.5", title: { en: "AI Pattern & Linkage Discovery", ar: "اكتشاف الأنماط والروابط بالذكاء الاصطناعي" }, desc: { en: "Use AI tools to discover patterns and connections across financial data.", ar: "استخدام أدوات الذكاء الاصطناعي لاكتشاف الأنماط والروابط." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Clear Articulation of Cash Flow Information", ar: "العرض الواضح لمعلومات التدفقات النقدية" },
        videos: [
          { num: "2.1", title: { en: "Operating, Investing & Financing Cash Flows", ar: "التدفقات التشغيلية والاستثمارية والتمويلية" }, desc: { en: "Structure operating, investing, and financing cash flows for clear reporting.", ar: "هيكل التدفقات النقدية التشغيلية والاستثمارية والتمويلية." }, duration: "25 min" },
          { num: "2.2", title: { en: "Direct & Indirect Methods", ar: "الطريقتان المباشرة وغير المباشرة" }, desc: { en: "Master both direct and indirect methods for preparing cash flow statements.", ar: "إتقان الطريقتين المباشرة وغير المباشرة لإعداد القائمة." }, duration: "25 min" },
          { num: "2.3", title: { en: "Liquidity & Solvency Drivers", ar: "محركات السيولة والملاءة المالية" }, desc: { en: "Identify key liquidity and solvency drivers from cash flow data.", ar: "تحديد محركات السيولة والملاءة المالية الرئيسية." }, duration: "25 min" },
          { num: "2.4", title: { en: "Cash Flow Indicator Communication", ar: "توصيل مؤشرات التدفق النقدي" }, desc: { en: "Communicate and analyze cash flow indicators effectively to stakeholders.", ar: "أساليب توصيل وتحليل مؤشرات التدفق النقدي بفعالية." }, duration: "25 min" },
          { num: "2.5", title: { en: "AI-Automated Cash Flow Extraction", ar: "أتمتة استخراج بيانات التدفقات النقدية" }, desc: { en: "Automate cash flow data extraction using AI-powered tools.", ar: "أتمتة استخراج بيانات التدفقات النقدية باستخدام الذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Effective Working Capital Oversight", ar: "الإشراف الفعّال على رأس المال العامل" },
        videos: [
          { num: "3.1", title: { en: "Working Capital Cycle & Components", ar: "دورة رأس المال العامل ومكوناته" }, desc: { en: "Understand the working capital cycle and its key components.", ar: "فهم دورة رأس المال العامل ومكوناته الرئيسية." }, duration: "25 min" },
          { num: "3.2", title: { en: "Receivables, Payables & Inventory Optimization", ar: "تحسين إدارة الذمم المدينة والدائنة والمخزون" }, desc: { en: "Optimize management of receivables, payables, and inventory for efficiency.", ar: "تحسين إدارة الذمم المدينة والدائنة والمخزون." }, duration: "25 min" },
          { num: "3.3", title: { en: "Conservative vs. Aggressive Approaches", ar: "النهج المحافظ مقابل النهج الجريء" }, desc: { en: "Compare conservative and aggressive approaches to working capital management.", ar: "مقارنة النهج المحافظ والنهج الجريء في إدارة رأس المال العامل." }, duration: "25 min" },
          { num: "3.4", title: { en: "Practical Liquidity Improvement", ar: "أساليب عملية لتحسين السيولة" }, desc: { en: "Apply practical methods to improve organizational liquidity.", ar: "تطبيق أساليب عملية لتحسين السيولة." }, duration: "25 min" },
          { num: "3.5", title: { en: "AI Efficiency & Early Warning Indicators", ar: "مؤشرات ذكاء اصطناعي للكفاءة والتنبيه المبكر" }, desc: { en: "Leverage AI-powered indicators for efficiency monitoring and early warning alerts.", ar: "الاستفادة من مؤشرات الذكاء الاصطناعي للكفاءة والتنبيه المبكر." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Techniques for Enhancing Cash Liquidity", ar: "تقنيات تعزيز السيولة النقدية" },
        videos: [
          { num: "4.1", title: { en: "Identifying Liquidity Gaps", ar: "تحديد فجوات السيولة" }, desc: { en: "Identify liquidity gaps using financial ratios and analysis techniques.", ar: "تحديد فجوات السيولة باستخدام النسب المالية." }, duration: "25 min" },
          { num: "4.2", title: { en: "Short-Term Financing & Treasury Management", ar: "التمويل قصير الأجل وإدارة الخزينة" }, desc: { en: "Implement short-term financing measures and treasury management practices.", ar: "إجراءات التمويل قصير الأجل وإدارة الخزينة." }, duration: "25 min" },
          { num: "4.3", title: { en: "Cash Conversion Cycle Efficiency", ar: "كفاءة دورة تحويل النقد" }, desc: { en: "Improve the efficiency of the cash conversion cycle for faster cash realization.", ar: "تحسين كفاءة دورة تحويل النقد." }, duration: "25 min" },
          { num: "4.4", title: { en: "Cash Pooling & Optimization Policies", ar: "سياسات تجميع النقد وتحسينها" }, desc: { en: "Develop and optimize cash pooling policies across the organization.", ar: "تطوير سياسات تجميع النقد وتحسينها." }, duration: "25 min" },
          { num: "4.5", title: { en: "Real-Time Liquidity Monitoring", ar: "المراقبة اللحظية للسيولة" }, desc: { en: "Implement real-time liquidity monitoring using advanced analytics tools.", ar: "المراقبة اللحظية للسيولة عبر أدوات التحليل المتقدمة." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "AI-Supported Cash Flow Trend Interpretation", ar: "تفسير اتجاهات التدفقات النقدية المدعوم بالذكاء الاصطناعي" },
        videos: [
          { num: "5.1", title: { en: "Trend Analysis Across Activities", ar: "تحليل الاتجاهات عبر الأنشطة" }, desc: { en: "Analyze trends across operating, investing, and financing activities.", ar: "تحليل الاتجاهات في الأنشطة التشغيلية والاستثمارية والتمويلية." }, duration: "25 min" },
          { num: "5.2", title: { en: "Deviation & Inconsistency Detection", ar: "اكتشاف الانحرافات وعدم الاتساق" }, desc: { en: "Detect deviations and inconsistencies in cash flow patterns.", ar: "اكتشاف الانحرافات وعدم الاتساق في أنماط التدفقات النقدية." }, duration: "25 min" },
          { num: "5.3", title: { en: "Cash Flow Behavior & Business Cycles", ar: "سلوك التدفقات النقدية ودورات الأعمال" }, desc: { en: "Link cash flow behavior to business cycles for strategic planning.", ar: "ربط سلوك التدفقات النقدية بدورات الأعمال." }, duration: "25 min" },
          { num: "5.4", title: { en: "Volatility & Instability Management", ar: "إدارة فترات التقلب وعدم الاستقرار" }, desc: { en: "Manage periods of volatility and instability in cash flows.", ar: "إدارة فترات التقلب وعدم الاستقرار في التدفقات النقدية." }, duration: "25 min" },
          { num: "5.5", title: { en: "AI-Driven Hidden Pattern Discovery", ar: "اكتشاف الأنماط الخفية بالذكاء الاصطناعي" }, desc: { en: "Leverage AI to discover hidden patterns in cash flow data.", ar: "استخدام الذكاء الاصطناعي لاكتشاف الأنماط الخفية." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "AI-Assisted Forecasting & Scenario Analysis", ar: "التنبؤ وتحليل السيناريوهات باستخدام الذكاء الاصطناعي" },
        videos: [
          { num: "6.1", title: { en: "Cash Flow Forecasting Fundamentals", ar: "أسس التنبؤ بالتدفقات النقدية" }, desc: { en: "Master the fundamentals of cash flow forecasting methodologies.", ar: "إتقان أسس التنبؤ بالتدفقات النقدية." }, duration: "25 min" },
          { num: "6.2", title: { en: "Traditional vs. AI Forecasting", ar: "التنبؤ التقليدي والتنبؤ بالذكاء الاصطناعي" }, desc: { en: "Compare traditional forecasting methods with AI-powered forecasting approaches.", ar: "المقارنة بين التنبؤ التقليدي والتنبؤ المعتمد على الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "6.3", title: { en: "Rolling Forecasts & Sensitivity Testing", ar: "التنبؤات المتجددة واختبارات الحساسية" }, desc: { en: "Implement rolling forecasts and sensitivity testing for agile planning.", ar: "تطبيق التنبؤات المتجددة واختبارات الحساسية." }, duration: "25 min" },
          { num: "6.4", title: { en: "Multi-Scenario Planning", ar: "تحليل وتخطيط السيناريوهات المتعددة" }, desc: { en: "Develop and analyze multiple scenarios for comprehensive financial planning.", ar: "تحليل وتخطيط السيناريوهات المتعددة للتخطيط المالي الشامل." }, duration: "25 min" },
          { num: "6.5", title: { en: "AI Model Forecast Accuracy", ar: "تعزيز دقة التنبؤ بنماذج الذكاء الاصطناعي" }, desc: { en: "Enhance forecast accuracy using AI models and machine learning techniques.", ar: "تعزيز دقة التنبؤ باستخدام نماذج الذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Leveraging AI Tools for Financial Decision-Making", ar: "توظيف أدوات الذكاء الاصطناعي لتعزيز اتخاذ القرار المالي" },
        videos: [
          { num: "7.1", title: { en: "Digital Tools for Liquidity Decisions", ar: "الأدوات الرقمية لقرارات السيولة" }, desc: { en: "Explore the role of digital tools in making informed liquidity decisions.", ar: "دور الأدوات الرقمية في قرارات السيولة." }, duration: "25 min" },
          { num: "7.2", title: { en: "Smart Monitoring Dashboards", ar: "لوحات معلومات ذكية للرصد والمتابعة" }, desc: { en: "Design and implement smart dashboards for real-time financial monitoring.", ar: "تصميم وتنفيذ لوحات معلومات ذكية للرصد والمتابعة." }, duration: "25 min" },
          { num: "7.3", title: { en: "Automated Investment & Financing Insights", ar: "رؤى آلية لدعم قرارات التمويل والاستثمار" }, desc: { en: "Generate automated insights to support financing and investment decisions.", ar: "توليد رؤى آلية لدعم قرارات التمويل والاستثمار." }, duration: "25 min" },
          { num: "7.4", title: { en: "Analytics for Risk Identification", ar: "التحليلات لتحديد المخاطر" }, desc: { en: "Use analytics to identify and assess financial risks proactively.", ar: "استخدام التحليلات في تحديد المخاطر المالية." }, duration: "25 min" },
          { num: "7.5", title: { en: "AI-Enhanced Financial Reports", ar: "تقارير مالية محسّنة بالذكاء الاصطناعي" }, desc: { en: "Produce AI-enhanced financial reports for improved decision quality.", ar: "إنتاج تقارير مالية محسّنة بالذكاء الاصطناعي لرفع جودة القرارات." }, duration: "25 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  AIPF — AI in Project Finance                                       */
  /* ------------------------------------------------------------------ */

  aipf: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام حضور هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "Project Financial Analysis", ar: "التحليل المالي للمشاريع" }, desc: { en: "Conduct comprehensive financial analysis for project feasibility.", ar: "إجراء تحليل مالي شامل لجدوى المشروع." } },
      { title: { en: "Risk Assessment & Mitigation", ar: "تقييم وتخفيف المخاطر" }, desc: { en: "Evaluate and mitigate project risks efficiently.", ar: "تقييم وتخفيف مخاطر المشروع بكفاءة." } },
      { title: { en: "Project Finance Structuring", ar: "هيكلة تمويل المشاريع" }, desc: { en: "Structure project financing for optimal outcomes.", ar: "هيكلة تمويل المشروع لتحقيق أفضل النتائج." } },
      { title: { en: "Financial Model Building", ar: "بناء النماذج المالية" }, desc: { en: "Build robust financial models for project evaluation.", ar: "بناء نماذج مالية قوية لتقييم المشروع." } },
      { title: { en: "Legal & Regulatory Compliance", ar: "الامتثال القانوني والتنظيمي" }, desc: { en: "Navigate legal and regulatory aspects of project finance.", ar: "فهم الجوانب القانونية والتنظيمية لتمويل المشروع." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Financial analysts, project managers, investment specialists, and legal consultants seeking to enhance their expertise in project finance and investment evaluation.", ar: "تم تصميم هذه الدورة للمحللين الماليين ومديري المشاريع والمتخصصين في الاستثمار والمستشارين القانونيين الذين يتطلعون إلى تعزيز خبراتهم في تمويل المشاريع وتقييم الاستثمار." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Financial Analysis", ar: "التحليل المالي" } },
      { text: { en: "Risk Assessment", ar: "تقييم المخاطر" } },
      { text: { en: "Deal Structuring", ar: "هيكلة الصفقات" } },
      { text: { en: "Legal Compliance", ar: "الامتثال القانوني" } },
      { text: { en: "Due Diligence", ar: "إجراء العناية الواجبة" } },
      { text: { en: "Financial Modeling", ar: "بناء النماذج المالية" } },
      { text: { en: "Cash Flow Management", ar: "إدارة التدفق النقدي" } },
      { text: { en: "Project Valuation", ar: "تقييم المشروع" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "6 Modules • 30 Video Lessons • 5 Days of Hands-On Training", ar: "6 وحدات • 30 درس فيديو • 5 أيام تدريب عملي" },
    modules: [
      {
        id: 1,
        title: { en: "Project Financial Analysis", ar: "التحليل المالي للمشاريع" },
        videos: [
          { num: "1.1", title: { en: "Project Finance Fundamentals", ar: "أساسيات تمويل المشروع" }, desc: { en: "Master the fundamentals of project finance and its key principles.", ar: "إتقان أساسيات تمويل المشروع ومبادئه الرئيسية." }, duration: "25 min" },
          { num: "1.2", title: { en: "Project Life Cycle Stages", ar: "مراحل دورة حياة المشروع" }, desc: { en: "Understand the stages of the project life cycle and their financial implications.", ar: "فهم مراحل دورة حياة المشروع وتأثيراتها المالية." }, duration: "25 min" },
          { num: "1.3", title: { en: "Financial Statements & Cash Flow Analysis", ar: "تحليل القوائم المالية وتدفقات النقد" }, desc: { en: "Analyze financial statements and cash flows specific to project finance.", ar: "تحليل القوائم المالية وتدفقات النقد في المشروع." }, duration: "25 min" },
          { num: "1.4", title: { en: "Performance Indicators & Financial Ratios", ar: "مؤشرات الأداء والنسب المالية" }, desc: { en: "Evaluate key performance indicators and financial ratios for project assessment.", ar: "تقييم مؤشرات الأداء والنسب المالية." }, duration: "25 min" },
          { num: "1.5", title: { en: "Profitability, ROI & Capital Structure", ar: "الربحية والعوائد والهيكل الرأسمالي" }, desc: { en: "Assess project profitability, investment returns, debt service coverage, and capital structure needs.", ar: "تقييم ربحية المشروع وعوائد الاستثمار ونسب تغطية خدمة الدين وتحديد احتياجات التمويل والهيكل الرأسمالي." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Risk Assessment", ar: "تقييم المخاطر" },
        videos: [
          { num: "2.1", title: { en: "Identifying Project Risks", ar: "التعرف على مخاطر المشروع" }, desc: { en: "Identify and categorize the various risks inherent in project finance.", ar: "التعرف على مخاطر المشروع وتصنيفها." }, duration: "25 min" },
          { num: "2.2", title: { en: "Risk Assessment Factors", ar: "عوامل تقييم المخاطر" }, desc: { en: "Evaluate key risk assessment factors for comprehensive project evaluation.", ar: "تقييم عوامل المخاطر الرئيسية للتقييم الشامل." }, duration: "25 min" },
          { num: "2.3", title: { en: "Financial, Operational & Market Risks", ar: "المخاطر المالية والتشغيلية والسوقية" }, desc: { en: "Measure and quantify financial, operational, and market risks.", ar: "قياس المخاطر المالية والتشغيلية والسوقية." }, duration: "25 min" },
          { num: "2.4", title: { en: "Risk Mitigation Strategies", ar: "استراتيجيات التقليل من المخاطر" }, desc: { en: "Develop effective strategies for risk mitigation and management.", ar: "وضع استراتيجيات فعالة للتقليل من المخاطر." }, duration: "25 min" },
          { num: "2.5", title: { en: "Sensitivity Analysis & Credit Risk", ar: "تحليل الحساسية ومخاطر الائتمان" }, desc: { en: "Perform sensitivity analysis, scenario evaluation, and credit risk assessment using risk-adjusted discount rates.", ar: "تقييم تحليل الحساسية والسيناريوهات ومخاطر الائتمان واستخدام معدلات الخصم المعدلة للمخاطر." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Deal Structuring", ar: "هيكلة الصفقات" },
        videos: [
          { num: "3.1", title: { en: "Project Finance Deal Structuring", ar: "هيكلة صفقات تمويل المشروع" }, desc: { en: "Structure project finance deals for optimal capital allocation.", ar: "هيكلة صفقات تمويل المشروع لتخصيص رأس المال الأمثل." }, duration: "25 min" },
          { num: "3.2", title: { en: "Capital Allocation & Funding Sources", ar: "تخصيص رأس المال ومصادر التمويل" }, desc: { en: "Optimize capital allocation and identify appropriate funding sources.", ar: "تحسين تخصيص رأس المال ومصادر التمويل." }, duration: "25 min" },
          { num: "3.3", title: { en: "Financing Strategies for Diverse Projects", ar: "استراتيجيات تمويل لمشاريع متنوعة" }, desc: { en: "Develop financing strategies tailored to diverse project types.", ar: "وضع استراتيجيات تمويل لمشاريع متنوعة." }, duration: "25 min" },
          { num: "3.4", title: { en: "Debt & Equity Balance", ar: "التوازن بين الديون وحقوق الملكية" }, desc: { en: "Balance debt and equity elements for optimal capital structure including WACC analysis.", ar: "تحقيق توازن بين عناصر الديون وحقوق الملكية وتحليل المتوسط المرجح لتكلفة رأس المال." }, duration: "25 min" },
          { num: "3.5", title: { en: "Repayment Structures & Documentation", ar: "هياكل السداد والتوثيق" }, desc: { en: "Design repayment structures and manage project finance documentation.", ar: "تصميم هياكل سداد التمويل وإدارة التوثيق لتمويل المشروع." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Legal Compliance", ar: "الامتثال القانوني" },
        videos: [
          { num: "4.1", title: { en: "Legal Frameworks & Regulations", ar: "الأطر والتنظيمات القانونية" }, desc: { en: "Navigate the legal frameworks and regulations governing project finance.", ar: "فهم الأطر والتنظيمات القانونية المتعلقة بتمويل المشاريع." }, duration: "25 min" },
          { num: "4.2", title: { en: "Contractual Compliance", ar: "الامتثال مع التزامات العقود" }, desc: { en: "Ensure compliance with contractual obligations in project finance agreements.", ar: "ضمان الامتثال مع التزامات العقود." }, duration: "25 min" },
          { num: "4.3", title: { en: "Interpreting Legal Agreements", ar: "تفسير الاتفاقيات القانونية" }, desc: { en: "Interpret legal agreements specific to project finance transactions.", ar: "تفسير الاتفاقيات القانونية في تمويل المشروع." }, duration: "25 min" },
          { num: "4.4", title: { en: "Legal Issues & Risk Management", ar: "القضايا القانونية وإدارة المخاطر" }, desc: { en: "Address legal issues related to project risks and dispute resolution.", ar: "التعامل مع قضايا قانونية متعلقة بمخاطر المشروع وفض النزاعات." }, duration: "25 min" },
          { num: "4.5", title: { en: "Minimizing Legal Challenges", ar: "التقليل من التحديات القانونية" }, desc: { en: "Minimize legal challenges during project implementation.", ar: "التقليل من التحديات القانونية في تنفيذ المشروع." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Due Diligence", ar: "التقييم الدقيق" },
        videos: [
          { num: "5.1", title: { en: "Comprehensive Due Diligence", ar: "التقييم الشامل" }, desc: { en: "Conduct comprehensive due diligence in project finance evaluations.", ar: "إجراء تقييم شامل في تمويل المشروع." }, duration: "25 min" },
          { num: "5.2", title: { en: "Technical, Financial & Operational Assessment", ar: "تقييم الجوانب التقنية والمالية والتشغيلية" }, desc: { en: "Evaluate technical, financial, and operational aspects of projects.", ar: "تقييم الجوانب التقنية والمالية والتشغيلية." }, duration: "25 min" },
          { num: "5.3", title: { en: "Key Project Insights & Opportunities", ar: "رؤى وفرص المشروع الرئيسية" }, desc: { en: "Identify key project insights and potential opportunities.", ar: "التعرف على رؤى وفرص المشروع الرئيسية." }, duration: "25 min" },
          { num: "5.4", title: { en: "Environmental & Social Impact", ar: "التأثير البيئي والاجتماعي" }, desc: { en: "Assess environmental and social impact of projects.", ar: "تقييم التأثير البيئي والاجتماعي." }, duration: "25 min" },
          { num: "5.5", title: { en: "Assumption Verification & Reporting", ar: "التحقق من الافتراضات وإعداد التقارير" }, desc: { en: "Verify project assumptions, assess feasibility, and prepare due diligence reports.", ar: "التحقق من افتراضات المشروع والقابلية للتنفيذ وإعداد تقارير التقييم الدقيق." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Financial Modeling", ar: "بناء النماذج المالية" },
        videos: [
          { num: "6.1", title: { en: "Building Robust Financial Models", ar: "بناء نماذج مالية محكمة" }, desc: { en: "Build robust financial models for comprehensive project evaluation.", ar: "بناء نماذج مالية محكمة لتقييم المشروع." }, duration: "25 min" },
          { num: "6.2", title: { en: "Cash Flow Projections & NPV Analysis", ar: "توقعات التدفقات النقدية وتحليل صافي القيمة الحالية" }, desc: { en: "Create cash flow projections and perform net present value analysis.", ar: "إنشاء توقعات التدفقات النقدية وتحليل صافي القيمة الحالية." }, duration: "25 min" },
          { num: "6.3", title: { en: "Scenario-Based Financial Models", ar: "نماذج مالية مبنية على السيناريوهات" }, desc: { en: "Create scenario-based financial models using Excel for comprehensive analysis.", ar: "إنشاء نماذج مالية استنادًا إلى السيناريوهات باستخدام Excel." }, duration: "25 min" },
          { num: "6.4", title: { en: "Sensitivity Analysis & Interpretation", ar: "تحليل الحساسية وتفسير النتائج" }, desc: { en: "Perform sensitivity analysis and interpret financial model results for decision-making.", ar: "إجراء تحليل الحساسية وتفسير نتائج النموذج المالي لاتخاذ القرارات." }, duration: "25 min" },
          { num: "6.5", title: { en: "Valuation Techniques & Feasibility", ar: "تقنيات التقييم ودراسة الجدوى" }, desc: { en: "Apply valuation techniques, assess project feasibility, and conduct practical workshops.", ar: "تطبيق تقنيات التقييم وتقييم جدوى المشروع وورش العمل ودراسة الحالة." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  AIEFAO — AI in Efficient Finance & Accounting Operations            */
  /* ------------------------------------------------------------------ */

  aiefao: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام حضور هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "Vision & Mission in Finance", ar: "الرؤية والرسالة في المالية" }, desc: { en: "Identify key elements of vision and mission in finance and accounting.", ar: "تحديد العناصر الرئيسية للرؤية والرسالة في المالية والمحاسبة." } },
      { title: { en: "Process Improvement", ar: "تحسين العمليات" }, desc: { en: "Evaluate and improve accounts payable, receivable, fixed assets, treasury, and payroll processes.", ar: "تقييم وتحسين عمليات الحسابات الدائنة، الحسابات المدينة، الأصول الثابتة، الخزينة والنقدية، والرواتب." } },
      { title: { en: "Budget Redesign", ar: "إعادة تصميم الموازنة" }, desc: { en: "Redesign the budgeting process and provide effective development recommendations.", ar: "إعادة تصميم عملية إعداد الموازنة وتقديم توصيات تطوير فعّالة." } },
      { title: { en: "Excel Reporting Tools", ar: "أدوات التقارير في إكسل" }, desc: { en: "Use Excel reporting tools and techniques to enhance speed and accuracy of financial operations.", ar: "استخدام أدوات وتقنيات التقارير في إكسل لتعزيز سرعة ودقة العمليات المالية." } },
      { title: { en: "Behavioral Concepts", ar: "المفاهيم السلوكية" }, desc: { en: "Understand behavioral concepts that impact the quality of financial work.", ar: "فهم المفاهيم السلوكية المؤثرة على جودة العمل المالي." } },
      { title: { en: "AI Productivity Tools", ar: "أدوات الإنتاجية بالذكاء الاصطناعي" }, desc: { en: "Leverage AI applications to enhance productivity in daily financial tasks.", ar: "الاستفادة من تطبيقات الذكاء الاصطناعي لرفع الإنتاجية في المهام اليومية." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Financial and non-financial professionals involved in improving decision-making, internal process development, budgeting and forecasting, capital allocation, and financial market transactions.", ar: "المهنيون الماليون وغير الماليين المشاركون في تحسين عملية اتخاذ القرار، والعاملون في تطوير العمليات الداخلية، وإعداد الموازنات والتوقعات، وتخصيص رأس المال، والتعاملات المالية في الأسواق." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Accounting Best Practices", ar: "أفضل الممارسات في المحاسبة" } },
      { text: { en: "Finance Best Practices", ar: "أفضل الممارسات في المالية" } },
      { text: { en: "Advanced Excel Technical Skills", ar: "المهارات التقنية المتقدمة في برنامج إكسل" } },
      { text: { en: "Asset Lifecycle Management", ar: "دورة حياة الأصول وإدارتها" } },
      { text: { en: "Budgeting Best Practices", ar: "أفضل أساليب إعداد الموازنة" } },
      { text: { en: "Interpersonal & Communication Skills", ar: "المهارات الشخصية والتواصلية" } },
      { text: { en: "AI-Powered Productivity Tools", ar: "أدوات الإنتاجية المدعومة بالذكاء الاصطناعي" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "8 Modules • 40 Video Lessons • 5 Days of Hands-On Training", ar: "8 وحدات • 40 درس فيديو • 5 أيام تدريب عملي" },
    prerequisiteNote: { en: "This course requires a laptop with Microsoft Excel 2016/2019/365 and Copilot feature on Windows OS.", ar: "هذه الدورة تتطلب استخدام أجهزة لابتوب تحتوي على Excel 2016/2019/365 وميزة Copilot بنظام Windows." },
    modules: [
      {
        id: 1,
        title: { en: "The Importance of Best Practices", ar: "أهمية تطبيق أفضل الممارسات" },
        videos: [
          { num: "1.1", title: { en: "Efficiency vs. Effectiveness", ar: "الفرق بين الكفاءة والفعالية" }, desc: { en: "Distinguish between efficiency and effectiveness in financial operations.", ar: "التمييز بين الكفاءة والفعالية في العمليات المالية." }, duration: "20 min" },
          { num: "1.2", title: { en: "Management Functions", ar: "وظائف الإدارة" }, desc: { en: "Understand core management functions and their role in financial operations.", ar: "فهم وظائف الإدارة الأساسية ودورها في العمليات المالية." }, duration: "20 min" },
          { num: "1.3", title: { en: "Finance & Accounting Vision & Mission", ar: "رؤية ورسالة المالية والمحاسبة" }, desc: { en: "Define the vision and mission of finance and accounting departments.", ar: "تحديد رؤية ورسالة المالية والمحاسبة." }, duration: "20 min" },
          { num: "1.4", title: { en: "Customer Service Role", ar: "دور خدمة العملاء" }, desc: { en: "Recognize the customer service role within financial operations.", ar: "فهم دور خدمة العملاء في العمليات المالية." }, duration: "20 min" },
          { num: "1.5", title: { en: "Financial Function Objectives", ar: "أهداف الوظيفة المالية" }, desc: { en: "Define the objectives of the financial function within the organization.", ar: "تحديد أهداف الوظيفة المالية داخل المؤسسة." }, duration: "20 min" },
        ],
      },
      {
        id: 2,
        title: { en: "The Accounting Cycle & Financial Statements", ar: "الدورة المحاسبية والقوائم المالية" },
        videos: [
          { num: "2.1", title: { en: "Accounting Transaction Processing Cycle", ar: "دورة معالجة العمليات المحاسبية" }, desc: { en: "Master the complete accounting transaction processing cycle.", ar: "إتقان دورة معالجة العمليات المحاسبية." }, duration: "25 min" },
          { num: "2.2", title: { en: "Income Statement", ar: "قائمة الدخل" }, desc: { en: "Analyze and prepare income statements for financial reporting.", ar: "تحليل وإعداد قائمة الدخل للتقارير المالية." }, duration: "25 min" },
          { num: "2.3", title: { en: "Balance Sheet", ar: "الميزانية العمومية" }, desc: { en: "Understand and prepare balance sheets for financial position reporting.", ar: "فهم وإعداد الميزانية العمومية لتقارير المركز المالي." }, duration: "25 min" },
          { num: "2.4", title: { en: "Cash Flow Statement", ar: "قائمة التدفقات النقدية" }, desc: { en: "Prepare and analyze cash flow statements using both direct and indirect methods.", ar: "إعداد وتحليل قائمة التدفقات النقدية بالطريقتين المباشرة وغير المباشرة." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Best Practices in Accounts Payable", ar: "أفضل الممارسات في الحسابات الدائنة" },
        videos: [
          { num: "3.1", title: { en: "Accounts Payable Lifecycle", ar: "دورة حياة الحسابات الدائنة" }, desc: { en: "Understand the complete accounts payable lifecycle and optimization opportunities.", ar: "فهم دورة حياة الحسابات الدائنة بالكامل وفرص التحسين." }, duration: "20 min" },
          { num: "3.2", title: { en: "Inefficiencies & Improvement Opportunities", ar: "أوجه القصور وفرص التحسين" }, desc: { en: "Identify inefficiencies and improvement opportunities in AP processes.", ar: "تحديد أوجه القصور والفرص المتاحة للتحسين في عمليات الحسابات الدائنة." }, duration: "20 min" },
          { num: "3.3", title: { en: "Vendor Portals", ar: "بوابات الموردين" }, desc: { en: "Implement vendor portals for streamlined supplier management.", ar: "تطبيق بوابات الموردين لتبسيط إدارة العلاقة مع الموردين." }, duration: "20 min" },
          { num: "3.4", title: { en: "Electronic Expense Reporting", ar: "تقارير المصروفات الإلكترونية" }, desc: { en: "Deploy electronic expense reporting systems for efficiency.", ar: "نشر أنظمة تقارير المصروفات الإلكترونية لتحسين الكفاءة." }, duration: "20 min" },
          { num: "3.5", title: { en: "E-Procurement & Document Management", ar: "الشراء الإلكتروني وإدارة المستندات" }, desc: { en: "Leverage e-procurement systems and document management for AP optimization.", ar: "الاستفادة من أنظمة الشراء الإلكتروني وإدارة المستندات لتحسين الحسابات الدائنة." }, duration: "20 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Best Practices in AR, Inventory & Cash", ar: "أفضل الممارسات في الحسابات المدينة والمخزون" },
        videos: [
          { num: "4.1", title: { en: "Accounts Receivable Lifecycle", ar: "دورة حياة الحسابات المدينة" }, desc: { en: "Manage the accounts receivable lifecycle from invoicing to collections.", ar: "إدارة دورة حياة الحسابات المدينة من الفوترة إلى التحصيل." }, duration: "25 min" },
          { num: "4.2", title: { en: "Provisions & Credit Policy", ar: "المخصصات وسياسة الائتمان" }, desc: { en: "Establish appropriate provisions and effective credit policies.", ar: "وضع المخصصات المناسبة وسياسات الائتمان الفعالة." }, duration: "25 min" },
          { num: "4.3", title: { en: "Billing & Collections", ar: "الفوترة والتحصيل" }, desc: { en: "Optimize billing and collections processes for improved cash flow.", ar: "تحسين عمليات الفوترة والتحصيل لتحسين التدفق النقدي." }, duration: "25 min" },
          { num: "4.4", title: { en: "Inventory Lifecycle & Costing Methods", ar: "دورة حياة المخزون وطرق التكلفة" }, desc: { en: "Manage inventory lifecycle, costing methods, and best practices for inventory management.", ar: "إدارة دورة حياة المخزون وطرق التكلفة وأفضل ممارسات إدارة المخزون." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Best Practices in Fixed Assets & Budgeting", ar: "أفضل الممارسات في الأصول الثابتة والموازنة" },
        videos: [
          { num: "5.1", title: { en: "Fixed Asset Lifecycle", ar: "دورة حياة الأصول الثابتة" }, desc: { en: "Manage the complete lifecycle of fixed assets from acquisition to disposal.", ar: "إدارة دورة حياة الأصول الثابتة الكاملة من الاستحواذ إلى الاستبعاد." }, duration: "25 min" },
          { num: "5.2", title: { en: "Capitalization vs. Expense", ar: "الرسملة مقابل المصروف" }, desc: { en: "Apply proper capitalization vs. expense decisions for fixed assets.", ar: "تطبيق قرارات الرسملة مقابل المصروف بشكل صحيح." }, duration: "25 min" },
          { num: "5.3", title: { en: "Asset Tracking", ar: "تتبع الأصول" }, desc: { en: "Implement effective asset tracking systems and procedures.", ar: "تطبيق أنظمة وإجراءات تتبع الأصول الفعالة." }, duration: "25 min" },
          { num: "5.4", title: { en: "Budgeting Methods", ar: "أساليب إعداد الموازنات" }, desc: { en: "Apply various budgeting methods for effective financial planning.", ar: "تطبيق أساليب متنوعة لإعداد الموازنات للتخطيط المالي الفعال." }, duration: "25 min" },
          { num: "5.5", title: { en: "Budget Process Efficiency", ar: "تحسين كفاءة عملية الموازنة" }, desc: { en: "Improve the efficiency and effectiveness of the budgeting process.", ar: "تحسين كفاءة وفعالية عملية الموازنة." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Reporting Best Practices Using MS Excel", ar: "أفضل الممارسات في التقارير باستخدام إكسل" },
        videos: [
          { num: "6.1", title: { en: "Data Consolidation & Validation", ar: "دمج البيانات والتحقق من الدقة" }, desc: { en: "Consolidate data from multiple sources and validate for accuracy.", ar: "دمج البيانات من مصادر متعددة والتحقق من دقتها." }, duration: "20 min" },
          { num: "6.2", title: { en: "PivotTables & Periodic Reports", ar: "PivotTables والتقارير الدورية" }, desc: { en: "Use PivotTables for dynamic reporting and prepare periodic financial reports.", ar: "استخدام PivotTables للتقارير الديناميكية وإعداد التقارير المالية الدورية." }, duration: "25 min" },
          { num: "6.3", title: { en: "Reconciliation & Payroll Reports", ar: "عمليات المطابقة وتقارير الرواتب" }, desc: { en: "Perform reconciliation processes and generate payroll reports in Excel.", ar: "تنفيذ عمليات المطابقة وإنشاء تقارير الرواتب في إكسل." }, duration: "25 min" },
          { num: "6.4", title: { en: "AP, Budget & Invoice Analysis Reports", ar: "تقارير الحسابات الدائنة والموازنة والفواتير" }, desc: { en: "Generate accounts payable, budget comparison, and invoice analysis reports.", ar: "إنشاء تقارير الحسابات الدائنة وتحليل الموازنة والفواتير." }, duration: "25 min" },
          { num: "6.5", title: { en: "Management Reporting", ar: "إعداد التقارير الإدارية" }, desc: { en: "Prepare comprehensive management reports for executive decision-making.", ar: "إعداد التقارير الإدارية الشاملة لدعم اتخاذ القرارات التنفيذية." }, duration: "25 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Essential Behavioral Concepts", ar: "المفاهيم السلوكية الأساسية لتعزيز أداء المالية والمحاسبة" },
        videos: [
          { num: "7.1", title: { en: "Effective Communication", ar: "التواصل الفعّال" }, desc: { en: "Master effective communication skills for finance professionals.", ar: "إتقان مهارات التواصل الفعّال للمهنيين الماليين." }, duration: "20 min" },
          { num: "7.2", title: { en: "Ethical Decision-Making", ar: "اتخاذ القرارات الأخلاقية" }, desc: { en: "Apply ethical decision-making frameworks in financial contexts.", ar: "تطبيق أطر اتخاذ القرارات الأخلاقية في السياقات المالية." }, duration: "20 min" },
          { num: "7.3", title: { en: "Adaptability & Change Management", ar: "التكيف وإدارة التغيير" }, desc: { en: "Build adaptability and change management capabilities.", ar: "بناء قدرات التكيف وإدارة التغيير." }, duration: "20 min" },
          { num: "7.4", title: { en: "Critical Thinking Skills", ar: "مهارات التفكير النقدي" }, desc: { en: "Develop critical thinking skills for complex financial analysis.", ar: "تطوير مهارات التفكير النقدي للتحليل المالي المعقد." }, duration: "20 min" },
          { num: "7.5", title: { en: "Problem-Solving Skills", ar: "مهارات حل المشكلات" }, desc: { en: "Enhance problem-solving skills for operational challenges.", ar: "تعزيز مهارات حل المشكلات للتحديات التشغيلية." }, duration: "20 min" },
        ],
      },
      {
        id: 8,
        title: { en: "AI-Powered Productivity Tools", ar: "أدوات الإنتاجية المدعومة بالذكاء الاصطناعي" },
        videos: [
          { num: "8.1", title: { en: "AI-Organized Financial Tasks", ar: "تنظيم المهام المالية بالذكاء الاصطناعي" }, desc: { en: "Organize financial tasks using AI tools for improved workflow.", ar: "تنظيم المهام المالية باستخدام الذكاء الاصطناعي لتحسين سير العمل." }, duration: "20 min" },
          { num: "8.2", title: { en: "Data Cleaning & Preparation Support", ar: "دعم تنظيف البيانات وتحضيرها" }, desc: { en: "Leverage AI to support data cleaning and preparation tasks.", ar: "الاستفادة من الذكاء الاصطناعي لدعم تنظيف البيانات وتحضيرها." }, duration: "20 min" },
          { num: "8.3", title: { en: "Quick Financial Insights Generation", ar: "توليد رؤى مالية سريعة" }, desc: { en: "Generate quick financial insights using simple AI prompts.", ar: "توليد رؤى مالية سريعة بأوامر بسيطة." }, duration: "20 min" },
          { num: "8.4", title: { en: "Report & Correspondence Summarization", ar: "تلخيص التقارير والمراسلات" }, desc: { en: "Summarize reports and correspondence efficiently using AI.", ar: "تلخيص التقارير والمراسلات بكفاءة باستخدام الذكاء الاصطناعي." }, duration: "20 min" },
          { num: "8.5", title: { en: "AI Features in Excel", ar: "ميزات الذكاء الاصطناعي في إكسل" }, desc: { en: "Explore and leverage AI features built into Microsoft Excel.", ar: "التعرف على ميزات الذكاء الاصطناعي داخل برنامج إكسل والاستفادة منها." }, duration: "20 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CASP — Certified AI Strategy Professional                          */
  /* ------------------------------------------------------------------ */

  casp: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "AI Landscape Analysis", ar: "تحليل مشهد الذكاء الاصطناعي" }, desc: { en: "Analyze the current landscape of AI technologies and their business implications.", ar: "تحليل المشهد الحالي لتقنيات الذكاء الاصطناعي وتأثيراتها على الأعمال." } },
      { title: { en: "Strategic AI Formulation", ar: "صياغة استراتيجية الذكاء الاصطناعي" }, desc: { en: "Formulate comprehensive AI strategies aligned with organizational goals.", ar: "صياغة استراتيجيات شاملة للذكاء الاصطناعي تتوافق مع أهداف المؤسسة." } },
      { title: { en: "Ethical AI Governance", ar: "الحوكمة الأخلاقية للذكاء الاصطناعي" }, desc: { en: "Evaluate ethical considerations and governance frameworks for AI implementation.", ar: "تقييم الاعتبارات الأخلاقية وأطر الحوكمة لتطبيق الذكاء الاصطناعي." } },
      { title: { en: "AI Innovation Leadership", ar: "قيادة الابتكار بالذكاء الاصطناعي" }, desc: { en: "Lead cross-functional teams in AI-driven innovation projects.", ar: "قيادة فرق متعددة التخصصات في مشاريع الابتكار المدعومة بالذكاء الاصطناعي." } },
      { title: { en: "Change Management for AI", ar: "إدارة التغيير للذكاء الاصطناعي" }, desc: { en: "Design effective change management strategies for AI adoption.", ar: "تصميم استراتيجيات فعّالة لإدارة التغيير لتبني الذكاء الاصطناعي." } },
      { title: { en: "Operational AI Opportunities", ar: "فرص الذكاء الاصطناعي التشغيلية" }, desc: { en: "Identify opportunities for AI to enhance operational efficiency and create new value.", ar: "تحديد فرص الذكاء الاصطناعي لتعزيز الكفاءة التشغيلية وخلق قيمة جديدة." } },
      { title: { en: "AI Integration Roadmap", ar: "خارطة طريق دمج الذكاء الاصطناعي" }, desc: { en: "Develop a strategic roadmap for integrating AI into their own organization.", ar: "تطوير خارطة طريق استراتيجية لدمج الذكاء الاصطناعي في مؤسساتهم." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Diverse group of professionals keen to leverage AI for strategic advantage: mid-to-senior level managers, business leaders for digital transformation, consultants advising on AI adoption, project managers overseeing AI projects, entrepreneurs integrating AI into ventures.", ar: "مجموعة متنوعة من المهنيين الحريصين على الاستفادة من الذكاء الاصطناعي لتحقيق ميزة استراتيجية: المدراء من المستوى المتوسط إلى الأعلى، وقادة الأعمال في التحول الرقمي، والمستشارون في تبني الذكاء الاصطناعي، ومدراء المشاريع المشرفون على مشاريع الذكاء الاصطناعي، ورواد الأعمال الذين يدمجون الذكاء الاصطناعي في مشاريعهم." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Strategic Foresight", ar: "الاستشراف الاستراتيجي" } },
      { text: { en: "AI Literacy", ar: "الإلمام بالذكاء الاصطناعي" } },
      { text: { en: "Ethical Governance", ar: "الحوكمة الأخلاقية" } },
      { text: { en: "Innovation Leadership", ar: "قيادة الابتكار" } },
      { text: { en: "Organizational Transformation", ar: "التحول المؤسسي" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "5 Modules • 25 Video Lessons • 5 Days of Training", ar: "5 وحدات • 25 درس فيديو • 5 أيام تدريب" },
    modules: [
      {
        id: 1,
        title: { en: "Foundations of AI Strategy", ar: "أسس استراتيجية الذكاء الاصطناعي" },
        videos: [
          { num: "1.1", title: { en: "Understanding the AI Landscape", ar: "فهم مشهد الذكاء الاصطناعي" }, desc: { en: "Explore the current state of AI technologies and their evolution across industries.", ar: "استكشاف الوضع الحالي لتقنيات الذكاء الاصطناعي وتطورها عبر الصناعات." }, duration: "25 min" },
          { num: "1.2", title: { en: "Strategic Opportunities & Threats", ar: "الفرص والتهديدات الاستراتيجية" }, desc: { en: "Identify strategic opportunities and threats presented by AI in the business landscape.", ar: "تحديد الفرص والتهديدات الاستراتيجية التي يقدمها الذكاء الاصطناعي في بيئة الأعمال." }, duration: "25 min" },
          { num: "1.3", title: { en: "Aligning AI with Business Objectives", ar: "مواءمة الذكاء الاصطناعي مع أهداف الأعمال" }, desc: { en: "Learn frameworks for aligning AI initiatives with core business objectives.", ar: "تعلم أطر مواءمة مبادرات الذكاء الاصطناعي مع أهداف الأعمال الأساسية." }, duration: "25 min" },
          { num: "1.4", title: { en: "Case Studies in AI Strategy", ar: "دراسات حالة في استراتيجية الذكاء الاصطناعي" }, desc: { en: "Examine real-world case studies of successful AI strategy implementation.", ar: "دراسة حالات واقعية لتطبيق ناجح لاستراتيجية الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "1.5", title: { en: "Developing an AI-Ready Mindset", ar: "تطوير عقلية جاهزة للذكاء الاصطناعي" }, desc: { en: "Cultivate the mindset and organizational culture needed for AI readiness.", ar: "تنمية العقلية والثقافة المؤسسية اللازمة للاستعداد للذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "AI Technologies and Business Applications", ar: "تقنيات الذكاء الاصطناعي وتطبيقات الأعمال" },
        videos: [
          { num: "2.1", title: { en: "Demystifying Key AI Technologies", ar: "تبسيط تقنيات الذكاء الاصطناعي الرئيسية" }, desc: { en: "Break down key AI technologies including machine learning, NLP, and computer vision.", ar: "تبسيط تقنيات الذكاء الاصطناعي الرئيسية بما في ذلك التعلم الآلي ومعالجة اللغة الطبيعية والرؤية الحاسوبية." }, duration: "25 min" },
          { num: "2.2", title: { en: "Capabilities & Limitations of AI", ar: "قدرات وقيود الذكاء الاصطناعي" }, desc: { en: "Understand the realistic capabilities and current limitations of AI technologies.", ar: "فهم القدرات الواقعية والقيود الحالية لتقنيات الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "2.3", title: { en: "Practical AI Applications Across Industries", ar: "تطبيقات الذكاء الاصطناعي العملية عبر الصناعات" }, desc: { en: "Explore practical AI applications across healthcare, finance, manufacturing, and more.", ar: "استكشاف تطبيقات الذكاء الاصطناعي العملية عبر الرعاية الصحية والمالية والتصنيع وغيرها." }, duration: "25 min" },
          { num: "2.4", title: { en: "Evaluating AI Solutions for Strategic Fit", ar: "تقييم حلول الذكاء الاصطناعي للملاءمة الاستراتيجية" }, desc: { en: "Develop criteria for evaluating AI solutions and their strategic fit within organizations.", ar: "تطوير معايير لتقييم حلول الذكاء الاصطناعي وملاءمتها الاستراتيجية داخل المؤسسات." }, duration: "25 min" },
          { num: "2.5", title: { en: "Bridging Technical & Business Objectives", ar: "الربط بين الأهداف التقنية والتجارية" }, desc: { en: "Learn to bridge the gap between technical AI capabilities and business objectives.", ar: "تعلم سد الفجوة بين القدرات التقنية للذكاء الاصطناعي وأهداف الأعمال." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Ethical AI and Governance", ar: "أخلاقيات الذكاء الاصطناعي والحوكمة" },
        videos: [
          { num: "3.1", title: { en: "Ethical Considerations in AI", ar: "الاعتبارات الأخلاقية في الذكاء الاصطناعي" }, desc: { en: "Examine the key ethical considerations surrounding AI deployment in organizations.", ar: "دراسة الاعتبارات الأخلاقية الرئيسية المحيطة بنشر الذكاء الاصطناعي في المؤسسات." }, duration: "25 min" },
          { num: "3.2", title: { en: "Establishing AI Governance Frameworks", ar: "إنشاء أطر حوكمة الذكاء الاصطناعي" }, desc: { en: "Design and implement comprehensive AI governance frameworks for responsible use.", ar: "تصميم وتنفيذ أطر حوكمة شاملة للذكاء الاصطناعي للاستخدام المسؤول." }, duration: "25 min" },
          { num: "3.3", title: { en: "Managing Societal Impact of AI", ar: "إدارة التأثير المجتمعي للذكاء الاصطناعي" }, desc: { en: "Understand and manage the broader societal impact of AI deployment.", ar: "فهم وإدارة التأثير المجتمعي الأوسع لنشر الذكاء الاصطناعي." }, duration: "25 min" },
          { num: "3.4", title: { en: "Developing Trust in AI Systems", ar: "بناء الثقة في أنظمة الذكاء الاصطناعي" }, desc: { en: "Build trust and transparency in AI systems through explainability and accountability.", ar: "بناء الثقة والشفافية في أنظمة الذكاء الاصطناعي من خلال قابلية التفسير والمساءلة." }, duration: "25 min" },
          { num: "3.5", title: { en: "Legal & Regulatory Landscape", ar: "المشهد القانوني والتنظيمي" }, desc: { en: "Navigate the evolving legal and regulatory landscape governing AI technologies.", ar: "التعامل مع المشهد القانوني والتنظيمي المتطور الذي يحكم تقنيات الذكاء الاصطناعي." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Leading AI Innovation and Transformation", ar: "قيادة الابتكار والتحول بالذكاء الاصطناعي" },
        videos: [
          { num: "4.1", title: { en: "Fostering AI Innovation Culture", ar: "تعزيز ثقافة الابتكار بالذكاء الاصطناعي" }, desc: { en: "Create an organizational culture that fosters AI innovation and experimentation.", ar: "خلق ثقافة مؤسسية تعزز الابتكار والتجريب بالذكاء الاصطناعي." }, duration: "25 min" },
          { num: "4.2", title: { en: "Leading AI Projects Effectively", ar: "قيادة مشاريع الذكاء الاصطناعي بفعالية" }, desc: { en: "Master leadership skills specific to managing AI projects and cross-functional teams.", ar: "إتقان مهارات القيادة الخاصة بإدارة مشاريع الذكاء الاصطناعي والفرق متعددة التخصصات." }, duration: "25 min" },
          { num: "4.3", title: { en: "Building AI-Ready Talent & Teams", ar: "بناء المواهب والفرق الجاهزة للذكاء الاصطناعي" }, desc: { en: "Develop strategies for building AI-ready talent pools and high-performing teams.", ar: "تطوير استراتيجيات لبناء مجموعات مواهب جاهزة للذكاء الاصطناعي وفرق عالية الأداء." }, duration: "25 min" },
          { num: "4.4", title: { en: "Driving Organizational Change for AI", ar: "قيادة التغيير المؤسسي للذكاء الاصطناعي" }, desc: { en: "Drive organizational change required for successful AI adoption and transformation.", ar: "قيادة التغيير المؤسسي المطلوب لتبني الذكاء الاصطناعي والتحول بنجاح." }, duration: "25 min" },
          { num: "4.5", title: { en: "Measuring AI Impact & ROI", ar: "قياس تأثير الذكاء الاصطناعي والعائد على الاستثمار" }, desc: { en: "Establish metrics and frameworks for measuring AI impact and return on investment.", ar: "وضع مقاييس وأطر لقياس تأثير الذكاء الاصطناعي والعائد على الاستثمار." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Implementing and Sustaining AI Strategy", ar: "تنفيذ واستدامة استراتيجية الذكاء الاصطناعي" },
        videos: [
          { num: "5.1", title: { en: "Developing an AI Implementation Roadmap", ar: "تطوير خارطة طريق تنفيذ الذكاء الاصطناعي" }, desc: { en: "Create a detailed implementation roadmap for AI strategy execution.", ar: "إنشاء خارطة طريق تفصيلية لتنفيذ استراتيجية الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.2", title: { en: "Managing Transition to AI-Powered Enterprise", ar: "إدارة الانتقال إلى مؤسسة مدعومة بالذكاء الاصطناعي" }, desc: { en: "Manage the organizational transition towards becoming an AI-powered enterprise.", ar: "إدارة الانتقال المؤسسي نحو التحول إلى مؤسسة مدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.3", title: { en: "Sustaining AI Value & Improvement", ar: "استدامة قيمة الذكاء الاصطناعي والتحسين" }, desc: { en: "Develop practices for sustaining AI value creation and continuous improvement.", ar: "تطوير ممارسات لاستدامة خلق القيمة من الذكاء الاصطناعي والتحسين المستمر." }, duration: "30 min" },
          { num: "5.4", title: { en: "Building Strategic AI Partnerships", ar: "بناء شراكات استراتيجية في الذكاء الاصطناعي" }, desc: { en: "Identify and build strategic partnerships to accelerate AI initiatives.", ar: "تحديد وبناء شراكات استراتيجية لتسريع مبادرات الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.5", title: { en: "Project Presentation & Peer Feedback", ar: "عرض المشروع وتقييم الأقران" }, desc: { en: "Present AI strategy projects and receive structured peer feedback for refinement.", ar: "عرض مشاريع استراتيجية الذكاء الاصطناعي وتلقي تقييم منظم من الأقران للتحسين." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CHRS — Certified AI - Human Resources Dynamics Strategist          */
  /* ------------------------------------------------------------------ */

  chrs: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "AI in Human Capital Management", ar: "الذكاء الاصطناعي في إدارة رأس المال البشري" }, desc: { en: "Evaluate the strategic role of AI in human capital management.", ar: "تقييم الدور الاستراتيجي للذكاء الاصطناعي في إدارة رأس المال البشري." } },
      { title: { en: "AI Tools for Workforce Planning", ar: "أدوات الذكاء الاصطناعي لتخطيط القوى العاملة" }, desc: { en: "Integrate AI tools into workforce planning and talent analytics.", ar: "دمج أدوات الذكاء الاصطناعي في تخطيط القوى العاملة وتحليلات المواهب." } },
      { title: { en: "Data-Driven HR Insights", ar: "رؤى الموارد البشرية المبنية على البيانات" }, desc: { en: "Interpret data-driven insights to inform HR decision-making.", ar: "تفسير الرؤى المبنية على البيانات لتوجيه قرارات الموارد البشرية." } },
      { title: { en: "Ethical AI Governance for HR", ar: "حوكمة الذكاء الاصطناعي الأخلاقية للموارد البشرية" }, desc: { en: "Design ethical AI governance frameworks for HR practices.", ar: "تصميم أطر حوكمة أخلاقية للذكاء الاصطناعي في ممارسات الموارد البشرية." } },
      { title: { en: "Change Through Automation", ar: "التغيير من خلال الأتمتة" }, desc: { en: "Lead organizational change through intelligent automation.", ar: "قيادة التغيير المؤسسي من خلال الأتمتة الذكية." } },
      { title: { en: "AI-Aligned Workforce Models", ar: "نماذج القوى العاملة المتوافقة مع الذكاء الاصطناعي" }, desc: { en: "Align AI strategies with human-centered workforce models.", ar: "مواءمة استراتيجيات الذكاء الاصطناعي مع نماذج القوى العاملة المتمحورة حول الإنسان." } },
      { title: { en: "Predictive Employee Engagement", ar: "التفاعل التنبؤي للموظفين" }, desc: { en: "Enhance employee experience through predictive engagement tools.", ar: "تعزيز تجربة الموظف من خلال أدوات التفاعل التنبؤية." } },
      { title: { en: "Future-Ready HR Capabilities", ar: "قدرات الموارد البشرية المستقبلية" }, desc: { en: "Transform HR capabilities for future-readiness and agility.", ar: "تحويل قدرات الموارد البشرية للجاهزية المستقبلية والمرونة." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Mid-level HR professionals, senior HR associates, HR business partners, human capital strategists and OD consultants, talent management leaders and employee engagement experts.", ar: "متخصصو الموارد البشرية من المستوى المتوسط، وكبار مسؤولي الموارد البشرية، وشركاء أعمال الموارد البشرية، واستراتيجيو رأس المال البشري ومستشارو التطوير المؤسسي، وقادة إدارة المواهب وخبراء تفاعل الموظفين." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Strategic Foresight", ar: "الاستشراف الاستراتيجي" } },
      { text: { en: "AI Integration", ar: "تكامل الذكاء الاصطناعي" } },
      { text: { en: "Workforce Intelligence", ar: "ذكاء القوى العاملة" } },
      { text: { en: "Change Enablement", ar: "تمكين التغيير" } },
      { text: { en: "Data Fluency", ar: "الطلاقة في البيانات" } },
      { text: { en: "Ethical Governance", ar: "الحوكمة الأخلاقية" } },
      { text: { en: "Human-AI Collaboration", ar: "التعاون بين الإنسان والذكاء الاصطناعي" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "7 Modules • 35 Video Lessons • 5 Days of Training", ar: "7 وحدات • 35 درس فيديو • 5 أيام تدريب" },
    modules: [
      {
        id: 1,
        title: { en: "Strategic Foresight", ar: "الاستشراف الاستراتيجي" },
        videos: [
          { num: "1.1", title: { en: "Future of Work Trends", ar: "اتجاهات مستقبل العمل" }, desc: { en: "Explore emerging trends shaping the future of work and their HR implications.", ar: "استكشاف الاتجاهات الناشئة التي تشكل مستقبل العمل وتأثيراتها على الموارد البشرية." }, duration: "20 min" },
          { num: "1.2", title: { en: "Industry AI Transformations", ar: "تحولات الذكاء الاصطناعي في الصناعات" }, desc: { en: "Understand how AI is transforming industries and workforce dynamics.", ar: "فهم كيف يحوّل الذكاء الاصطناعي الصناعات وديناميكيات القوى العاملة." }, duration: "20 min" },
          { num: "1.3", title: { en: "Mapping Talent Landscapes", ar: "رسم خرائط المواهب" }, desc: { en: "Map current and future talent landscapes to anticipate workforce needs.", ar: "رسم خرائط المواهب الحالية والمستقبلية لاستباق احتياجات القوى العاملة." }, duration: "20 min" },
          { num: "1.4", title: { en: "Future-Ready HR Structures", ar: "هياكل الموارد البشرية المستقبلية" }, desc: { en: "Design HR structures that are resilient and adaptable for the future.", ar: "تصميم هياكل موارد بشرية مرنة وقابلة للتكيف مع المستقبل." }, duration: "20 min" },
          { num: "1.5", title: { en: "Building Foresight into HR Strategy", ar: "دمج الاستشراف في استراتيجية الموارد البشرية" }, desc: { en: "Integrate strategic foresight methodologies into HR planning processes.", ar: "دمج منهجيات الاستشراف الاستراتيجي في عمليات تخطيط الموارد البشرية." }, duration: "20 min" },
        ],
      },
      {
        id: 2,
        title: { en: "AI Integration", ar: "تكامل الذكاء الاصطناعي" },
        videos: [
          { num: "2.1", title: { en: "AI Technologies in HR", ar: "تقنيات الذكاء الاصطناعي في الموارد البشرية" }, desc: { en: "Overview of AI technologies applicable to HR functions and processes.", ar: "نظرة عامة على تقنيات الذكاء الاصطناعي القابلة للتطبيق في وظائف وعمليات الموارد البشرية." }, duration: "20 min" },
          { num: "2.2", title: { en: "Automating Recruitment Processes", ar: "أتمتة عمليات التوظيف" }, desc: { en: "Leverage AI to automate and enhance recruitment and candidate screening.", ar: "الاستفادة من الذكاء الاصطناعي لأتمتة وتحسين التوظيف وفحص المرشحين." }, duration: "20 min" },
          { num: "2.3", title: { en: "Enhancing Performance Management", ar: "تعزيز إدارة الأداء" }, desc: { en: "Apply AI tools to improve performance management and feedback cycles.", ar: "تطبيق أدوات الذكاء الاصطناعي لتحسين إدارة الأداء ودورات التقييم." }, duration: "20 min" },
          { num: "2.4", title: { en: "AI for Learning & Development", ar: "الذكاء الاصطناعي للتعلم والتطوير" }, desc: { en: "Use AI to personalize learning pathways and accelerate employee development.", ar: "استخدام الذكاء الاصطناعي لتخصيص مسارات التعلم وتسريع تطوير الموظفين." }, duration: "20 min" },
          { num: "2.5", title: { en: "AI in HR Operations", ar: "الذكاء الاصطناعي في عمليات الموارد البشرية" }, desc: { en: "Streamline day-to-day HR operations using AI-powered automation.", ar: "تبسيط عمليات الموارد البشرية اليومية باستخدام الأتمتة المدعومة بالذكاء الاصطناعي." }, duration: "20 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Workforce Intelligence", ar: "ذكاء القوى العاملة" },
        videos: [
          { num: "3.1", title: { en: "Interpreting Talent Analytics", ar: "تفسير تحليلات المواهب" }, desc: { en: "Interpret talent analytics data to derive actionable workforce insights.", ar: "تفسير بيانات تحليلات المواهب لاستخلاص رؤى قابلة للتنفيذ حول القوى العاملة." }, duration: "20 min" },
          { num: "3.2", title: { en: "Linking Analytics to HR Strategy", ar: "ربط التحليلات باستراتيجية الموارد البشرية" }, desc: { en: "Connect workforce analytics outputs to strategic HR decision-making.", ar: "ربط مخرجات تحليلات القوى العاملة باتخاذ القرارات الاستراتيجية للموارد البشرية." }, duration: "20 min" },
          { num: "3.3", title: { en: "Real-Time People Analytics", ar: "تحليلات الأشخاص في الوقت الفعلي" }, desc: { en: "Implement real-time people analytics for dynamic workforce monitoring.", ar: "تنفيذ تحليلات الأشخاص في الوقت الفعلي لمراقبة القوى العاملة الديناميكية." }, duration: "20 min" },
          { num: "3.4", title: { en: "AI-Powered Succession Planning", ar: "تخطيط التعاقب المدعوم بالذكاء الاصطناعي" }, desc: { en: "Use AI to enhance succession planning and leadership pipeline development.", ar: "استخدام الذكاء الاصطناعي لتعزيز تخطيط التعاقب وتطوير خط القيادة." }, duration: "20 min" },
          { num: "3.5", title: { en: "Metrics That Matter in Modern HR", ar: "المقاييس المهمة في الموارد البشرية الحديثة" }, desc: { en: "Identify and track the HR metrics that drive organizational performance.", ar: "تحديد وتتبع مقاييس الموارد البشرية التي تدفع الأداء المؤسسي." }, duration: "20 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Change Enablement", ar: "تمكين التغيير" },
        videos: [
          { num: "4.1", title: { en: "Human Side of Transformation", ar: "الجانب الإنساني للتحول" }, desc: { en: "Understand the human factors that drive or resist organizational transformation.", ar: "فهم العوامل الإنسانية التي تدفع أو تقاوم التحول المؤسسي." }, duration: "20 min" },
          { num: "4.2", title: { en: "Communicating Change with Impact", ar: "التواصل حول التغيير بتأثير" }, desc: { en: "Develop impactful communication strategies for change initiatives.", ar: "تطوير استراتيجيات تواصل مؤثرة لمبادرات التغيير." }, duration: "20 min" },
          { num: "4.3", title: { en: "Change Readiness Assessments", ar: "تقييمات الاستعداد للتغيير" }, desc: { en: "Conduct readiness assessments to gauge organizational preparedness for change.", ar: "إجراء تقييمات الاستعداد لقياس جاهزية المؤسسة للتغيير." }, duration: "20 min" },
          { num: "4.4", title: { en: "Embedding Change Through Culture", ar: "ترسيخ التغيير من خلال الثقافة" }, desc: { en: "Embed sustainable change through cultural transformation initiatives.", ar: "ترسيخ التغيير المستدام من خلال مبادرات التحول الثقافي." }, duration: "20 min" },
          { num: "4.5", title: { en: "Driving AI Adoption in HR", ar: "دفع تبني الذكاء الاصطناعي في الموارد البشرية" }, desc: { en: "Accelerate AI adoption within HR through structured change enablement.", ar: "تسريع تبني الذكاء الاصطناعي في الموارد البشرية من خلال تمكين التغيير المنظم." }, duration: "20 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Data Fluency", ar: "الطلاقة في البيانات" },
        videos: [
          { num: "5.1", title: { en: "Developing HR Data Literacy", ar: "تطوير الإلمام بالبيانات في الموارد البشرية" }, desc: { en: "Build foundational data literacy skills for HR professionals.", ar: "بناء مهارات الإلمام بالبيانات الأساسية لمتخصصي الموارد البشرية." }, duration: "20 min" },
          { num: "5.2", title: { en: "Building Effective Dashboards", ar: "بناء لوحات معلومات فعّالة" }, desc: { en: "Design and build effective HR dashboards for data visualization.", ar: "تصميم وبناء لوحات معلومات فعّالة للموارد البشرية لتصور البيانات." }, duration: "20 min" },
          { num: "5.3", title: { en: "Data Privacy & Compliance", ar: "خصوصية البيانات والامتثال" }, desc: { en: "Ensure data privacy and regulatory compliance in HR data management.", ar: "ضمان خصوصية البيانات والامتثال التنظيمي في إدارة بيانات الموارد البشرية." }, duration: "20 min" },
          { num: "5.4", title: { en: "Managing Large Datasets", ar: "إدارة مجموعات البيانات الكبيرة" }, desc: { en: "Handle and process large HR datasets efficiently and accurately.", ar: "التعامل مع مجموعات بيانات الموارد البشرية الكبيرة ومعالجتها بكفاءة ودقة." }, duration: "20 min" },
          { num: "5.5", title: { en: "Aligning Data to Decisions", ar: "مواءمة البيانات مع القرارات" }, desc: { en: "Translate data insights into strategic HR decisions and actions.", ar: "ترجمة رؤى البيانات إلى قرارات وإجراءات استراتيجية للموارد البشرية." }, duration: "20 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Ethical Governance", ar: "الحوكمة الأخلاقية" },
        videos: [
          { num: "6.1", title: { en: "AI Ethics in HR", ar: "أخلاقيات الذكاء الاصطناعي في الموارد البشرية" }, desc: { en: "Explore ethical principles governing AI use in human resources.", ar: "استكشاف المبادئ الأخلاقية التي تحكم استخدام الذكاء الاصطناعي في الموارد البشرية." }, duration: "20 min" },
          { num: "6.2", title: { en: "Establishing Ethical HR Frameworks", ar: "إنشاء أطر أخلاقية للموارد البشرية" }, desc: { en: "Build ethical frameworks that guide responsible AI deployment in HR.", ar: "بناء أطر أخلاقية توجه النشر المسؤول للذكاء الاصطناعي في الموارد البشرية." }, duration: "20 min" },
          { num: "6.3", title: { en: "Creating Responsible AI Policies", ar: "إنشاء سياسات ذكاء اصطناعي مسؤولة" }, desc: { en: "Develop comprehensive responsible AI policies for HR operations.", ar: "تطوير سياسات شاملة للذكاء الاصطناعي المسؤول لعمليات الموارد البشرية." }, duration: "20 min" },
          { num: "6.4", title: { en: "Navigating Legal Implications", ar: "التعامل مع الآثار القانونية" }, desc: { en: "Navigate the legal implications of AI use in employment and HR.", ar: "التعامل مع الآثار القانونية لاستخدام الذكاء الاصطناعي في التوظيف والموارد البشرية." }, duration: "20 min" },
          { num: "6.5", title: { en: "Building Trust in AI-Driven HR", ar: "بناء الثقة في الموارد البشرية المدعومة بالذكاء الاصطناعي" }, desc: { en: "Establish trust among employees and stakeholders in AI-driven HR systems.", ar: "بناء الثقة بين الموظفين وأصحاب المصلحة في أنظمة الموارد البشرية المدعومة بالذكاء الاصطناعي." }, duration: "20 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Human-AI Collaboration", ar: "التعاون بين الإنسان والذكاء الاصطناعي" },
        videos: [
          { num: "7.1", title: { en: "Balancing Tech & Human Judgment", ar: "الموازنة بين التكنولوجيا والحكم البشري" }, desc: { en: "Find the right balance between AI automation and human judgment in HR.", ar: "إيجاد التوازن الصحيح بين أتمتة الذكاء الاصطناعي والحكم البشري في الموارد البشرية." }, duration: "20 min" },
          { num: "7.2", title: { en: "Designing Collaborative Workflows", ar: "تصميم مسارات عمل تعاونية" }, desc: { en: "Design workflows that optimize collaboration between humans and AI systems.", ar: "تصميم مسارات عمل تحسّن التعاون بين البشر وأنظمة الذكاء الاصطناعي." }, duration: "20 min" },
          { num: "7.3", title: { en: "Empowering Employees with AI", ar: "تمكين الموظفين بالذكاء الاصطناعي" }, desc: { en: "Empower employees to effectively leverage AI tools in their daily work.", ar: "تمكين الموظفين من الاستفادة الفعّالة من أدوات الذكاء الاصطناعي في عملهم اليومي." }, duration: "20 min" },
          { num: "7.4", title: { en: "AI & Leadership Decision-Making", ar: "الذكاء الاصطناعي واتخاذ القرارات القيادية" }, desc: { en: "Integrate AI insights into leadership decision-making processes.", ar: "دمج رؤى الذكاء الاصطناعي في عمليات اتخاذ القرارات القيادية." }, duration: "20 min" },
          { num: "7.5", title: { en: "Humanizing Digital Transformation", ar: "أنسنة التحول الرقمي" }, desc: { en: "Ensure digital transformation remains human-centered and employee-focused.", ar: "ضمان أن يظل التحول الرقمي متمحوراً حول الإنسان ومركزاً على الموظف." }, duration: "20 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CAIQLP — Certified AI Quality Leadership Professional              */
  /* ------------------------------------------------------------------ */

  caiqlp: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "AI Integration in Quality", ar: "دمج الذكاء الاصطناعي في الجودة" }, desc: { en: "Integrate AI tools into routine quality activities without weakening controls.", ar: "دمج أدوات الذكاء الاصطناعي في أنشطة الجودة الروتينية دون إضعاف الضوابط." } },
      { title: { en: "AI Pilot Planning", ar: "التخطيط التجريبي للذكاء الاصطناعي" }, desc: { en: "Plan small pilot uses of AI for documentation, reporting, and basic analysis.", ar: "التخطيط لاستخدامات تجريبية صغيرة للذكاء الاصطناعي في التوثيق والتقارير والتحليل الأساسي." } },
      { title: { en: "AI Oversight & Risk Management", ar: "الرقابة وإدارة المخاطر في الذكاء الاصطناعي" }, desc: { en: "Establish oversight for data privacy, hallucinations, bias, and intellectual property.", ar: "إنشاء رقابة على خصوصية البيانات والهلوسات والتحيز والملكية الفكرية." } },
      { title: { en: "AI Team Direction", ar: "توجيه فرق الذكاء الاصطناعي" }, desc: { en: "Direct teams using clear roles, RACI, and simple SOPs for AI-supported tasks.", ar: "توجيه الفرق باستخدام أدوار واضحة ومصفوفة RACI وإجراءات تشغيل بسيطة للمهام المدعومة بالذكاء الاصطناعي." } },
      { title: { en: "AI Output Validation", ar: "التحقق من مخرجات الذكاء الاصطناعي" }, desc: { en: "Validate AI outputs against ISO/standards with structured reviews and evidence logs.", ar: "التحقق من مخرجات الذكاء الاصطناعي مقابل معايير ISO بمراجعات منظمة وسجلات الأدلة." } },
      { title: { en: "AI in PDCA Cycles", ar: "الذكاء الاصطناعي في دورات PDCA" }, desc: { en: "Embed AI activities into PDCA cycles to sustain improvement.", ar: "تضمين أنشطة الذكاء الاصطناعي في دورات PDCA لاستدامة التحسين." } },
      { title: { en: "Audit-Ready Communication", ar: "التواصل الجاهز للتدقيق" }, desc: { en: "Communicate outcomes with audit-ready evidence for management review.", ar: "إيصال النتائج بأدلة جاهزة للتدقيق لمراجعة الإدارة." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Supervisors, team leaders, and managers who want to guide teams in responsibly applying AI within quality systems while maintaining compliance and control.", ar: "المشرفون وقادة الفرق والمدراء الذين يرغبون في توجيه فرقهم لتطبيق الذكاء الاصطناعي بمسؤولية ضمن أنظمة الجودة مع الحفاظ على الامتثال والرقابة." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "AI Quality Governance", ar: "حوكمة جودة الذكاء الاصطناعي" } },
      { text: { en: "Strategic AI Risk Management", ar: "إدارة المخاطر الاستراتيجية للذكاء الاصطناعي" } },
      { text: { en: "Compliance Integration Plan", ar: "خطة تكامل الامتثال" } },
      { text: { en: "Performance Measurement Design", ar: "تصميم قياس الأداء" } },
      { text: { en: "Organizational AI Adoption", ar: "تبني الذكاء الاصطناعي المؤسسي" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "5 Modules • 20 Video Lessons • 5 Days of Training", ar: "5 وحدات • 20 درس فيديو • 5 أيام تدريب" },
    modules: [
      {
        id: 1,
        title: { en: "AI & Quality Leadership Basics", ar: "أساسيات الذكاء الاصطناعي وقيادة الجودة" },
        videos: [
          { num: "1.1", title: { en: "Why Leaders Must Understand AI", ar: "لماذا يجب على القادة فهم الذكاء الاصطناعي" }, desc: { en: "Understand why quality leaders must develop AI literacy in the modern landscape.", ar: "فهم لماذا يجب على قادة الجودة تطوير الإلمام بالذكاء الاصطناعي في المشهد الحديث." }, duration: "30 min" },
          { num: "1.2", title: { en: "Role of AI in Customer Focus & Compliance", ar: "دور الذكاء الاصطناعي في التركيز على العملاء والامتثال" }, desc: { en: "Explore how AI supports customer focus and regulatory compliance in quality.", ar: "استكشاف كيف يدعم الذكاء الاصطناعي التركيز على العملاء والامتثال التنظيمي في الجودة." }, duration: "30 min" },
          { num: "1.3", title: { en: "Assistive vs. Autonomous AI Use", ar: "الاستخدام المساعد مقابل المستقل للذكاء الاصطناعي" }, desc: { en: "Distinguish between assistive and autonomous AI use cases in quality systems.", ar: "التمييز بين حالات الاستخدام المساعد والمستقل للذكاء الاصطناعي في أنظمة الجودة." }, duration: "30 min" },
          { num: "1.4", title: { en: "Traceability & Guardrails", ar: "التتبع والضوابط الوقائية" }, desc: { en: "Establish traceability mechanisms and guardrails for AI-assisted quality processes.", ar: "إنشاء آليات التتبع والضوابط الوقائية لعمليات الجودة المدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Planning AI Use in Quality", ar: "تخطيط استخدام الذكاء الاصطناعي في الجودة" },
        videos: [
          { num: "2.1", title: { en: "Choosing Safe Starter Areas", ar: "اختيار المجالات الأولية الآمنة" }, desc: { en: "Identify safe and appropriate starting areas for AI deployment in quality.", ar: "تحديد المجالات الأولية الآمنة والمناسبة لنشر الذكاء الاصطناعي في الجودة." }, duration: "30 min" },
          { num: "2.2", title: { en: "Identifying AI Risks", ar: "تحديد مخاطر الذكاء الاصطناعي" }, desc: { en: "Assess and identify risks associated with AI use in quality management.", ar: "تقييم وتحديد المخاطر المرتبطة باستخدام الذكاء الاصطناعي في إدارة الجودة." }, duration: "30 min" },
          { num: "2.3", title: { en: "Oversight Design & Audit Trails", ar: "تصميم الرقابة ومسارات التدقيق" }, desc: { en: "Design oversight structures and maintain audit trails for AI activities.", ar: "تصميم هياكل الرقابة والحفاظ على مسارات التدقيق لأنشطة الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "2.4", title: { en: "Pilot Scoping & Success Criteria", ar: "تحديد نطاق التجربة ومعايير النجاح" }, desc: { en: "Define pilot scope, objectives, and measurable success criteria.", ar: "تحديد نطاق التجربة والأهداف ومعايير النجاح القابلة للقياس." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Leading AI-Supported Teams", ar: "قيادة الفرق المدعومة بالذكاء الاصطناعي" },
        videos: [
          { num: "3.1", title: { en: "Assigning Tasks with AI Support", ar: "توزيع المهام بدعم الذكاء الاصطناعي" }, desc: { en: "Assign and delegate tasks effectively with AI support and clear role definitions.", ar: "توزيع وتفويض المهام بفعالية مع دعم الذكاء الاصطناعي وتعريف واضح للأدوار." }, duration: "30 min" },
          { num: "3.2", title: { en: "Checking Outputs for ISO Compliance", ar: "فحص المخرجات للامتثال لمعايير ISO" }, desc: { en: "Review and validate AI outputs to ensure ISO standard compliance.", ar: "مراجعة والتحقق من مخرجات الذكاء الاصطناعي لضمان الامتثال لمعايير ISO." }, duration: "30 min" },
          { num: "3.3", title: { en: "Evidence for Audits", ar: "الأدلة للتدقيق" }, desc: { en: "Prepare and organize evidence documentation for quality audits.", ar: "إعداد وتنظيم وثائق الأدلة لتدقيقات الجودة." }, duration: "30 min" },
          { num: "3.4", title: { en: "Workflow Integration with AI", ar: "تكامل سير العمل مع الذكاء الاصطناعي" }, desc: { en: "Integrate AI tools into existing quality management workflows seamlessly.", ar: "دمج أدوات الذكاء الاصطناعي في مسارات إدارة الجودة الحالية بسلاسة." }, duration: "30 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Building a Culture of AI-Enabled Quality", ar: "بناء ثقافة الجودة المدعومة بالذكاء الاصطناعي" },
        videos: [
          { num: "4.1", title: { en: "Encouraging Safe Experimentation", ar: "تشجيع التجريب الآمن" }, desc: { en: "Foster a culture of safe experimentation with AI in quality processes.", ar: "تعزيز ثقافة التجريب الآمن مع الذكاء الاصطناعي في عمليات الجودة." }, duration: "30 min" },
          { num: "4.2", title: { en: "AI in PDCA Cycles", ar: "الذكاء الاصطناعي في دورات PDCA" }, desc: { en: "Embed AI activities within Plan-Do-Check-Act cycles for continuous improvement.", ar: "تضمين أنشطة الذكاء الاصطناعي ضمن دورات التخطيط-التنفيذ-التحقق-التصحيح للتحسين المستمر." }, duration: "30 min" },
          { num: "4.3", title: { en: "Adoption & Communication Cadence", ar: "إيقاع التبني والتواصل" }, desc: { en: "Establish regular communication cadence for AI adoption progress and updates.", ar: "إنشاء إيقاع تواصل منتظم لتقدم تبني الذكاء الاصطناعي والتحديثات." }, duration: "30 min" },
          { num: "4.4", title: { en: "Stop/Scale Decisions for Pilots", ar: "قرارات الإيقاف أو التوسع للتجارب" }, desc: { en: "Make informed stop or scale decisions for AI pilot programs based on evidence.", ar: "اتخاذ قرارات مدروسة بالإيقاف أو التوسع للبرامج التجريبية للذكاء الاصطناعي بناءً على الأدلة." }, duration: "30 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Measurement, Reporting & Audit Readiness", ar: "القياس والتقارير والاستعداد للتدقيق" },
        videos: [
          { num: "5.1", title: { en: "Leading & Lagging Indicators", ar: "المؤشرات القائدة والمتأخرة" }, desc: { en: "Define and track leading and lagging indicators for AI quality initiatives.", ar: "تحديد وتتبع المؤشرات القائدة والمتأخرة لمبادرات جودة الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.2", title: { en: "Packaging Evidence for Reviews", ar: "تجهيز الأدلة للمراجعات" }, desc: { en: "Package and present evidence effectively for management reviews.", ar: "تجهيز وتقديم الأدلة بفعالية لمراجعات الإدارة." }, duration: "30 min" },
          { num: "5.3", title: { en: "Supplier/Customer Assurance", ar: "ضمان الموردين والعملاء" }, desc: { en: "Provide assurance to suppliers and customers on AI-quality processes.", ar: "تقديم الضمانات للموردين والعملاء حول عمليات جودة الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "5.4", title: { en: "Final Pilot Consolidation", ar: "التوحيد النهائي للتجربة" }, desc: { en: "Consolidate pilot learnings and prepare for full-scale AI quality deployment.", ar: "توحيد الدروس المستفادة من التجربة والاستعداد لنشر جودة الذكاء الاصطناعي على نطاق واسع." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CAPA — Certified AI Powered Accountant                             */
  /* ------------------------------------------------------------------ */

  capa: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "AI Fundamentals in Accounting", ar: "أساسيات الذكاء الاصطناعي في المحاسبة" }, desc: { en: "Apply AI fundamentals to accounting workflows.", ar: "تطبيق أساسيات الذكاء الاصطناعي في مسارات العمل المحاسبية." } },
      { title: { en: "Automated Bookkeeping", ar: "مسك الدفاتر الآلي" }, desc: { en: "Automate bookkeeping and transaction recording using AI tools.", ar: "أتمتة مسك الدفاتر وتسجيل المعاملات باستخدام أدوات الذكاء الاصطناعي." } },
      { title: { en: "AI Financial Reporting", ar: "التقارير المالية بالذكاء الاصطناعي" }, desc: { en: "Streamline financial reporting and analysis with AI-driven processes.", ar: "تبسيط التقارير المالية والتحليل من خلال العمليات المدعومة بالذكاء الاصطناعي." } },
      { title: { en: "AI-Assisted Excel", ar: "إكسل المدعوم بالذكاء الاصطناعي" }, desc: { en: "Utilize AI-assisted Excel formulas and functions for reporting.", ar: "استخدام صيغ ووظائف إكسل المدعومة بالذكاء الاصطناعي لإعداد التقارير." } },
      { title: { en: "Enhanced Accuracy", ar: "تعزيز الدقة" }, desc: { en: "Enhance accuracy and reduce errors in accounting tasks.", ar: "تعزيز الدقة وتقليل الأخطاء في المهام المحاسبية." } },
      { title: { en: "AI-Driven Insights", ar: "رؤى مدعومة بالذكاء الاصطناعي" }, desc: { en: "Extract actionable insights from accounting data using AI.", ar: "استخلاص رؤى قابلة للتنفيذ من البيانات المحاسبية باستخدام الذكاء الاصطناعي." } },
      { title: { en: "AI Tool Integration", ar: "تكامل أدوات الذكاء الاصطناعي" }, desc: { en: "Integrate AI tools to improve efficiency and decision-making.", ar: "دمج أدوات الذكاء الاصطناعي لتحسين الكفاءة واتخاذ القرار." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Accountants, auditors, and finance managers seeking to leverage AI tools for automation, reporting efficiency, accurate bookkeeping, and smarter decision-making.", ar: "المحاسبون والمدققون ومدراء المالية الذين يسعون للاستفادة من أدوات الذكاء الاصطناعي للأتمتة وكفاءة التقارير ودقة مسك الدفاتر واتخاذ قرارات أذكى." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Bookkeeping Automation", ar: "أتمتة مسك الدفاتر" } },
      { text: { en: "Financial Reporting", ar: "التقارير المالية" } },
      { text: { en: "Excel Optimization", ar: "تحسين إكسل" } },
      { text: { en: "Data Analysis", ar: "تحليل البيانات" } },
      { text: { en: "Process Efficiency", ar: "كفاءة العمليات" } },
      { text: { en: "Error Reduction", ar: "تقليل الأخطاء" } },
      { text: { en: "Accounting Insights", ar: "رؤى محاسبية" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "5 Modules • 14 Video Lessons • 5 Days of Training", ar: "5 وحدات • 14 درس فيديو • 5 أيام تدريب" },
    modules: [
      {
        id: 1,
        title: { en: "Foundations of AI in Accounting", ar: "أسس الذكاء الاصطناعي في المحاسبة" },
        videos: [
          { num: "1.1", title: { en: "Introduction to AI & ML & NLP", ar: "مقدمة في الذكاء الاصطناعي والتعلم الآلي ومعالجة اللغة الطبيعية" }, desc: { en: "Understand the fundamentals of AI, machine learning, and natural language processing.", ar: "فهم أساسيات الذكاء الاصطناعي والتعلم الآلي ومعالجة اللغة الطبيعية." }, duration: "30 min" },
          { num: "1.2", title: { en: "AI Applications in Accounting Workflows", ar: "تطبيقات الذكاء الاصطناعي في مسارات العمل المحاسبية" }, desc: { en: "Explore how AI is applied across various accounting workflows and processes.", ar: "استكشاف كيفية تطبيق الذكاء الاصطناعي عبر مسارات العمل والعمليات المحاسبية المختلفة." }, duration: "30 min" },
          { num: "1.3", title: { en: "AI Capabilities for Automation", ar: "قدرات الذكاء الاصطناعي للأتمتة" }, desc: { en: "Assess AI capabilities and their potential for automating accounting tasks.", ar: "تقييم قدرات الذكاء الاصطناعي وإمكاناته لأتمتة المهام المحاسبية." }, duration: "30 min" },
        ],
      },
      {
        id: 2,
        title: { en: "AI-Powered Bookkeeping", ar: "مسك الدفاتر المدعوم بالذكاء الاصطناعي" },
        videos: [
          { num: "2.1", title: { en: "Automating Transaction Recording", ar: "أتمتة تسجيل المعاملات" }, desc: { en: "Automate transaction recording processes using AI-powered tools.", ar: "أتمتة عمليات تسجيل المعاملات باستخدام أدوات مدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "2.2", title: { en: "AI for Error Detection & Anomaly ID", ar: "الذكاء الاصطناعي لاكتشاف الأخطاء وتحديد الشذوذ" }, desc: { en: "Use AI to detect errors and identify anomalies in financial records.", ar: "استخدام الذكاء الاصطناعي لاكتشاف الأخطاء وتحديد الشذوذ في السجلات المالية." }, duration: "30 min" },
          { num: "2.3", title: { en: "Hands-On AI Bookkeeping Tools", ar: "أدوات مسك الدفاتر بالذكاء الاصطناعي - تطبيق عملي" }, desc: { en: "Practice with hands-on AI bookkeeping tools in real-world scenarios.", ar: "التدريب العملي على أدوات مسك الدفاتر بالذكاء الاصطناعي في سيناريوهات واقعية." }, duration: "30 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Automating Financial Reporting with AI", ar: "أتمتة التقارير المالية بالذكاء الاصطناعي" },
        videos: [
          { num: "3.1", title: { en: "AI-Driven Report Generation", ar: "إنشاء التقارير المدعوم بالذكاء الاصطناعي" }, desc: { en: "Generate financial reports automatically using AI-driven processes.", ar: "إنشاء التقارير المالية تلقائياً باستخدام العمليات المدعومة بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "3.2", title: { en: "Streamlining Financial Statements & KPIs", ar: "تبسيط القوائم المالية ومؤشرات الأداء" }, desc: { en: "Streamline financial statement preparation and KPI tracking with AI.", ar: "تبسيط إعداد القوائم المالية وتتبع مؤشرات الأداء بالذكاء الاصطناعي." }, duration: "30 min" },
          { num: "3.3", title: { en: "Scenario-Based Reporting Exercises", ar: "تمارين التقارير القائمة على السيناريوهات" }, desc: { en: "Apply AI reporting skills through scenario-based practical exercises.", ar: "تطبيق مهارات التقارير بالذكاء الاصطناعي من خلال تمارين عملية قائمة على السيناريوهات." }, duration: "30 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Excel Formulas Using AI", ar: "صيغ إكسل باستخدام الذكاء الاصطناعي" },
        videos: [
          { num: "4.1", title: { en: "AI-Assisted Formulas & Functions", ar: "الصيغ والوظائف المدعومة بالذكاء الاصطناعي" }, desc: { en: "Leverage AI to create and optimize Excel formulas and functions.", ar: "الاستفادة من الذكاء الاصطناعي لإنشاء وتحسين صيغ ووظائف إكسل." }, duration: "30 min" },
          { num: "4.2", title: { en: "Automating Data Processing in Excel", ar: "أتمتة معالجة البيانات في إكسل" }, desc: { en: "Automate data processing tasks in Excel using AI capabilities.", ar: "أتمتة مهام معالجة البيانات في إكسل باستخدام قدرات الذكاء الاصطناعي." }, duration: "30 min" },
          { num: "4.3", title: { en: "Integrating AI into Excel Workflows", ar: "دمج الذكاء الاصطناعي في مسارات عمل إكسل" }, desc: { en: "Integrate AI tools seamlessly into existing Excel workflows.", ar: "دمج أدوات الذكاء الاصطناعي بسلاسة في مسارات عمل إكسل الحالية." }, duration: "30 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Integrated AI Applications in Accounting", ar: "تطبيقات الذكاء الاصطناعي المتكاملة في المحاسبة" },
        videos: [
          { num: "5.1", title: { en: "AI in Bookkeeping Reporting & Excel Combined", ar: "الذكاء الاصطناعي في مسك الدفاتر والتقارير وإكسل مجتمعة" }, desc: { en: "Combine AI bookkeeping, reporting, and Excel skills in integrated workflows.", ar: "الجمع بين مهارات مسك الدفاتر والتقارير وإكسل بالذكاء الاصطناعي في مسارات عمل متكاملة." }, duration: "30 min" },
          { num: "5.2", title: { en: "End-to-End Accounting Automation Exercises", ar: "تمارين الأتمتة المحاسبية الشاملة" }, desc: { en: "Complete end-to-end accounting automation exercises using AI tools.", ar: "إتمام تمارين الأتمتة المحاسبية الشاملة باستخدام أدوات الذكاء الاصطناعي." }, duration: "30 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CCTP — Certified Cost Transformation Practitioner                  */
  /* ------------------------------------------------------------------ */

  cctp: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "Cost Structure Analysis", ar: "تحليل هيكل التكاليف" }, desc: { en: "Examine existing cost structures and identify inefficiencies.", ar: "فحص هياكل التكاليف الحالية وتحديد أوجه القصور." } },
      { title: { en: "Transformation Frameworks", ar: "أطر التحول" }, desc: { en: "Apply structured frameworks for cost transformation.", ar: "تطبيق أطر منظمة لتحويل التكاليف." } },
      { title: { en: "Analytical Tools Proficiency", ar: "إتقان الأدوات التحليلية" }, desc: { en: "Use Excel, Power BI, and Copilot to analyze and report cost performance.", ar: "استخدام إكسل وباور بي آي وكوبايلوت لتحليل أداء التكاليف وإعداد التقارير." } },
      { title: { en: "Data-Driven Decision Making", ar: "اتخاذ القرارات المبنية على البيانات" }, desc: { en: "Link financial and operational data for smarter decisions.", ar: "ربط البيانات المالية والتشغيلية لاتخاذ قرارات أذكى." } },
      { title: { en: "Practical Transformation Delivery", ar: "تنفيذ التحول العملي" }, desc: { en: "Deliver practical transformation initiatives that drive measurable value.", ar: "تنفيذ مبادرات تحول عملية تحقق قيمة قابلة للقياس." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Finance and cost professionals, FP&A and budgeting teams, business transformation specialists, strategy and performance analysts.", ar: "متخصصو المالية والتكاليف، وفرق التخطيط والتحليل المالي والميزانية، ومتخصصو تحول الأعمال، ومحللو الاستراتيجية والأداء." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Strategic Cost Awareness", ar: "الوعي الاستراتيجي بالتكاليف" } },
      { text: { en: "Cost Structure Mapping in Excel", ar: "رسم خرائط هيكل التكاليف في إكسل" } },
      { text: { en: "Transformation Frameworks and Phases", ar: "أطر ومراحل التحول" } },
      { text: { en: "Copilot for Cost Insights", ar: "كوبايلوت لرؤى التكاليف" } },
      { text: { en: "Performance Metrics and Dashboards", ar: "مقاييس الأداء ولوحات المعلومات" } },
      { text: { en: "Efficiency and Process Improvement", ar: "الكفاءة وتحسين العمليات" } },
      { text: { en: "Cost Forecasting and Scenario Modeling", ar: "التنبؤ بالتكاليف ونمذجة السيناريوهات" } },
      { text: { en: "Implementation and Change Readiness", ar: "التنفيذ والاستعداد للتغيير" } },
      { text: { en: "Capstone Project", ar: "المشروع التطبيقي" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "9 Modules • 44 Video Lessons • 5 Days of Training", ar: "9 وحدات • 44 درس فيديو • 5 أيام تدريب" },
    modules: [
      {
        id: 1,
        title: { en: "Strategic Cost Awareness", ar: "الوعي الاستراتيجي بالتكاليف" },
        videos: [
          { num: "1.1", title: { en: "Concept of Cost Transformation", ar: "مفهوم تحول التكاليف" }, desc: { en: "Understand the core concept and principles of cost transformation.", ar: "فهم المفهوم الأساسي ومبادئ تحول التكاليف." }, duration: "20 min" },
          { num: "1.2", title: { en: "Cost Efficiency & Strategy Link", ar: "كفاءة التكاليف والارتباط بالاستراتيجية" }, desc: { en: "Link cost efficiency initiatives to broader organizational strategy.", ar: "ربط مبادرات كفاءة التكاليف بالاستراتيجية المؤسسية الأوسع." }, duration: "20 min" },
          { num: "1.3", title: { en: "Cost Categories Overview", ar: "نظرة عامة على فئات التكاليف" }, desc: { en: "Classify and understand different cost categories and their behavior.", ar: "تصنيف وفهم فئات التكاليف المختلفة وسلوكها." }, duration: "20 min" },
          { num: "1.4", title: { en: "Organizational Readiness", ar: "الاستعداد المؤسسي" }, desc: { en: "Assess organizational readiness for cost transformation initiatives.", ar: "تقييم الاستعداد المؤسسي لمبادرات تحول التكاليف." }, duration: "20 min" },
          { num: "1.5", title: { en: "Drivers of Financial Sustainability", ar: "محركات الاستدامة المالية" }, desc: { en: "Identify key drivers that support long-term financial sustainability.", ar: "تحديد المحركات الرئيسية التي تدعم الاستدامة المالية طويلة المدى." }, duration: "20 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Cost Structure Mapping in Excel", ar: "رسم خرائط هيكل التكاليف في إكسل" },
        videos: [
          { num: "2.1", title: { en: "Visualization of Cost Elements", ar: "تصور عناصر التكاليف" }, desc: { en: "Visualize cost elements using Excel charts and formatting tools.", ar: "تصور عناصر التكاليف باستخدام مخططات إكسل وأدوات التنسيق." }, duration: "20 min" },
          { num: "2.2", title: { en: "Functional & Departmental Cost View", ar: "عرض التكاليف الوظيفية والإدارية" }, desc: { en: "Map costs by function and department for comprehensive analysis.", ar: "رسم خرائط التكاليف حسب الوظيفة والإدارة للتحليل الشامل." }, duration: "20 min" },
          { num: "2.3", title: { en: "Identification of Cost Drivers", ar: "تحديد محركات التكاليف" }, desc: { en: "Identify and analyze the key drivers behind cost variations.", ar: "تحديد وتحليل المحركات الرئيسية وراء تغيرات التكاليف." }, duration: "20 min" },
          { num: "2.4", title: { en: "Benchmark Comparison Templates", ar: "قوالب المقارنة المعيارية" }, desc: { en: "Build Excel templates for benchmarking cost performance against industry standards.", ar: "بناء قوالب إكسل للمقارنة المعيارية لأداء التكاليف مقابل معايير الصناعة." }, duration: "20 min" },
          { num: "2.5", title: { en: "Diagnostic Summary & Insights", ar: "الملخص التشخيصي والرؤى" }, desc: { en: "Create diagnostic summaries that deliver actionable cost insights.", ar: "إنشاء ملخصات تشخيصية تقدم رؤى تكاليف قابلة للتنفيذ." }, duration: "20 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Transformation Frameworks and Phases", ar: "أطر ومراحل التحول" },
        videos: [
          { num: "3.1", title: { en: "Core Phases of Cost Transformation", ar: "المراحل الأساسية لتحول التكاليف" }, desc: { en: "Understand the core phases of a cost transformation journey.", ar: "فهم المراحل الأساسية لرحلة تحول التكاليف." }, duration: "20 min" },
          { num: "3.2", title: { en: "Key Enablers & Stakeholders", ar: "الممكنات الرئيسية وأصحاب المصلحة" }, desc: { en: "Identify key enablers and engage stakeholders for successful transformation.", ar: "تحديد الممكنات الرئيسية وإشراك أصحاب المصلحة لتحقيق تحول ناجح." }, duration: "20 min" },
          { num: "3.3", title: { en: "Progress Tracking & Accountability", ar: "تتبع التقدم والمساءلة" }, desc: { en: "Establish progress tracking mechanisms and accountability structures.", ar: "إنشاء آليات تتبع التقدم وهياكل المساءلة." }, duration: "20 min" },
          { num: "3.4", title: { en: "Financial Checkpoints", ar: "نقاط التحقق المالية" }, desc: { en: "Design financial checkpoints throughout the transformation process.", ar: "تصميم نقاط التحقق المالية خلال عملية التحول." }, duration: "20 min" },
          { num: "3.5", title: { en: "Common Transformation Challenges", ar: "تحديات التحول الشائعة" }, desc: { en: "Recognize and overcome common challenges in cost transformation.", ar: "التعرف على التحديات الشائعة في تحول التكاليف والتغلب عليها." }, duration: "20 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Copilot for Cost Insights", ar: "كوبايلوت لرؤى التكاليف" },
        videos: [
          { num: "4.1", title: { en: "Copilot Overview for Finance", ar: "نظرة عامة على كوبايلوت للمالية" }, desc: { en: "Overview of Microsoft Copilot capabilities for finance professionals.", ar: "نظرة عامة على قدرات مايكروسوفت كوبايلوت لمتخصصي المالية." }, duration: "20 min" },
          { num: "4.2", title: { en: "Cost Summary from Excel Files", ar: "ملخص التكاليف من ملفات إكسل" }, desc: { en: "Use Copilot to generate cost summaries from Excel files quickly.", ar: "استخدام كوبايلوت لإنشاء ملخصات التكاليف من ملفات إكسل بسرعة." }, duration: "20 min" },
          { num: "4.3", title: { en: "Quick Variance Insights", ar: "رؤى سريعة حول الانحرافات" }, desc: { en: "Generate quick variance insights and explanations using Copilot.", ar: "إنشاء رؤى وتفسيرات سريعة حول الانحرافات باستخدام كوبايلوت." }, duration: "20 min" },
          { num: "4.4", title: { en: "Scenario Commentary Support", ar: "دعم التعليق على السيناريوهات" }, desc: { en: "Leverage Copilot for scenario commentary and narrative reporting.", ar: "الاستفادة من كوبايلوت للتعليق على السيناريوهات وإعداد التقارير السردية." }, duration: "20 min" },
          { num: "4.5", title: { en: "Professional AI Tool Utilization", ar: "الاستخدام المهني لأدوات الذكاء الاصطناعي" }, desc: { en: "Master professional use of AI tools for cost analysis and reporting.", ar: "إتقان الاستخدام المهني لأدوات الذكاء الاصطناعي لتحليل التكاليف وإعداد التقارير." }, duration: "20 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Performance Metrics and Dashboards", ar: "مقاييس الأداء ولوحات المعلومات" },
        videos: [
          { num: "5.1", title: { en: "Key Cost KPIs & Ratios", ar: "مؤشرات الأداء والنسب الرئيسية للتكاليف" }, desc: { en: "Define and calculate key cost KPIs and financial ratios.", ar: "تحديد وحساب مؤشرات الأداء الرئيسية والنسب المالية للتكاليف." }, duration: "20 min" },
          { num: "5.2", title: { en: "Building Visuals in Power BI", ar: "بناء التصورات في باور بي آي" }, desc: { en: "Build compelling cost performance visuals using Power BI.", ar: "بناء تصورات مقنعة لأداء التكاليف باستخدام باور بي آي." }, duration: "20 min" },
          { num: "5.3", title: { en: "Linking Cost to Performance", ar: "ربط التكاليف بالأداء" }, desc: { en: "Connect cost metrics to overall organizational performance indicators.", ar: "ربط مقاييس التكاليف بمؤشرات الأداء المؤسسي الشامل." }, duration: "20 min" },
          { num: "5.4", title: { en: "Variance Display & Interpretation", ar: "عرض وتفسير الانحرافات" }, desc: { en: "Display and interpret cost variances effectively in dashboards.", ar: "عرض وتفسير انحرافات التكاليف بفعالية في لوحات المعلومات." }, duration: "20 min" },
          { num: "5.5", title: { en: "Executive Summary Dashboards", ar: "لوحات معلومات الملخص التنفيذي" }, desc: { en: "Design executive summary dashboards for senior management reporting.", ar: "تصميم لوحات معلومات الملخص التنفيذي لتقارير الإدارة العليا." }, duration: "20 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Efficiency and Process Improvement", ar: "الكفاءة وتحسين العمليات" },
        videos: [
          { num: "6.1", title: { en: "Common Cost Inefficiencies", ar: "أوجه القصور الشائعة في التكاليف" }, desc: { en: "Identify and analyze common cost inefficiencies across organizations.", ar: "تحديد وتحليل أوجه القصور الشائعة في التكاليف عبر المؤسسات." }, duration: "20 min" },
          { num: "6.2", title: { en: "Lean-Based Improvement Ideas", ar: "أفكار التحسين القائمة على اللين" }, desc: { en: "Apply lean-based improvement methodologies to reduce waste and cost.", ar: "تطبيق منهجيات التحسين القائمة على اللين لتقليل الهدر والتكاليف." }, duration: "20 min" },
          { num: "6.3", title: { en: "Tracking Efficiency Results", ar: "تتبع نتائج الكفاءة" }, desc: { en: "Track and measure efficiency improvement results over time.", ar: "تتبع وقياس نتائج تحسين الكفاءة بمرور الوقت." }, duration: "20 min" },
          { num: "6.4", title: { en: "Real Transformation Examples", ar: "أمثلة واقعية للتحول" }, desc: { en: "Study real-world cost transformation examples and lessons learned.", ar: "دراسة أمثلة واقعية لتحول التكاليف والدروس المستفادة." }, duration: "20 min" },
        ],
      },
      {
        id: 7,
        title: { en: "Cost Forecasting and Scenario Modeling", ar: "التنبؤ بالتكاليف ونمذجة السيناريوهات" },
        videos: [
          { num: "7.1", title: { en: "Forecasting Templates in Excel", ar: "قوالب التنبؤ في إكسل" }, desc: { en: "Build forecasting templates in Excel for cost projection and planning.", ar: "بناء قوالب التنبؤ في إكسل لتوقع التكاليف والتخطيط." }, duration: "20 min" },
          { num: "7.2", title: { en: "What-If & Sensitivity Analysis", ar: "تحليل ماذا لو وتحليل الحساسية" }, desc: { en: "Perform what-if and sensitivity analysis for cost scenario evaluation.", ar: "إجراء تحليل ماذا لو وتحليل الحساسية لتقييم سيناريوهات التكاليف." }, duration: "20 min" },
          { num: "7.3", title: { en: "Scenario Summary Tables", ar: "جداول ملخص السيناريوهات" }, desc: { en: "Create scenario summary tables for comparative cost analysis.", ar: "إنشاء جداول ملخص السيناريوهات للتحليل المقارن للتكاليف." }, duration: "20 min" },
          { num: "7.4", title: { en: "Power BI Trend Visualization", ar: "تصور الاتجاهات في باور بي آي" }, desc: { en: "Visualize cost trends and patterns using Power BI dashboards.", ar: "تصور اتجاهات وأنماط التكاليف باستخدام لوحات معلومات باور بي آي." }, duration: "20 min" },
          { num: "7.5", title: { en: "Insight Review for Decisions", ar: "مراجعة الرؤى لاتخاذ القرارات" }, desc: { en: "Review analytical insights to support strategic cost decisions.", ar: "مراجعة الرؤى التحليلية لدعم قرارات التكاليف الاستراتيجية." }, duration: "20 min" },
        ],
      },
      {
        id: 8,
        title: { en: "Implementation and Change Readiness", ar: "التنفيذ والاستعداد للتغيير" },
        videos: [
          { num: "8.1", title: { en: "Steps to Implement Transformation", ar: "خطوات تنفيذ التحول" }, desc: { en: "Follow structured steps to implement cost transformation initiatives.", ar: "اتباع خطوات منظمة لتنفيذ مبادرات تحول التكاليف." }, duration: "20 min" },
          { num: "8.2", title: { en: "Stakeholder Alignment & Follow-Up", ar: "مواءمة أصحاب المصلحة والمتابعة" }, desc: { en: "Align stakeholders and establish follow-up mechanisms for accountability.", ar: "مواءمة أصحاب المصلحة وإنشاء آليات متابعة للمساءلة." }, duration: "20 min" },
          { num: "8.3", title: { en: "Monitoring with Excel Trackers", ar: "المراقبة بأدوات التتبع في إكسل" }, desc: { en: "Monitor transformation progress using Excel-based tracking tools.", ar: "مراقبة تقدم التحول باستخدام أدوات التتبع في إكسل." }, duration: "20 min" },
          { num: "8.4", title: { en: "Sustaining Benefits Over Time", ar: "استدامة الفوائد بمرور الوقت" }, desc: { en: "Develop strategies for sustaining transformation benefits over time.", ar: "تطوير استراتيجيات لاستدامة فوائد التحول بمرور الوقت." }, duration: "20 min" },
          { num: "8.5", title: { en: "Review of Success Factors", ar: "مراجعة عوامل النجاح" }, desc: { en: "Review critical success factors for cost transformation programs.", ar: "مراجعة عوامل النجاح الحاسمة لبرامج تحول التكاليف." }, duration: "20 min" },
        ],
      },
      {
        id: 9,
        title: { en: "Capstone Project", ar: "المشروع التطبيقي" },
        videos: [
          { num: "9.1", title: { en: "Realistic Cost Scenario", ar: "سيناريو تكاليف واقعي" }, desc: { en: "Analyze a realistic cost scenario using all learned frameworks and tools.", ar: "تحليل سيناريو تكاليف واقعي باستخدام جميع الأطر والأدوات المكتسبة." }, duration: "20 min" },
          { num: "9.2", title: { en: "Group Simulation & Analysis", ar: "المحاكاة والتحليل الجماعي" }, desc: { en: "Participate in group simulation exercises for collaborative cost analysis.", ar: "المشاركة في تمارين المحاكاة الجماعية للتحليل التعاوني للتكاليف." }, duration: "20 min" },
          { num: "9.3", title: { en: "Presenting Recommendations", ar: "عرض التوصيات" }, desc: { en: "Present cost transformation recommendations to stakeholders.", ar: "عرض توصيات تحول التكاليف على أصحاب المصلحة." }, duration: "20 min" },
          { num: "9.4", title: { en: "Instructor Feedback & Review", ar: "تقييم ومراجعة المدرب" }, desc: { en: "Receive instructor feedback and review of capstone project deliverables.", ar: "تلقي تقييم المدرب ومراجعة مخرجات المشروع التطبيقي." }, duration: "20 min" },
          { num: "9.5", title: { en: "Certification Completion", ar: "إتمام الشهادة" }, desc: { en: "Complete certification requirements and final assessment.", ar: "إتمام متطلبات الشهادة والتقييم النهائي." }, duration: "20 min" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  CDA — Certificate in Data Analysis & Business Reporting            */
  /* ------------------------------------------------------------------ */

  cda: {
    objectivesTitle: { en: "Course Objectives", ar: "أهداف الدورة" },
    objectivesIntro: { en: "By completing this course, participants will be able to:", ar: "بعد إتمام هذه الدورة، سيتمكن المشاركون من:" },
    objectives: [
      { title: { en: "Data Massaging & Normalization", ar: "معالجة وتطبيع البيانات" }, desc: { en: "Massage and normalize unstructured data for analysis-ready formats.", ar: "معالجة وتطبيع البيانات غير المهيكلة لتحويلها إلى صيغ جاهزة للتحليل." } },
      { title: { en: "Pivot Table Reporting", ar: "التقارير باستخدام جداول البيفوت" }, desc: { en: "Perform reporting and analysis using Pivot Tables and Power Pivot.", ar: "إجراء التقارير والتحليلات باستخدام جداول البيفوت وباور بيفوت." } },
      { title: { en: "Dynamic Reporting Models", ar: "نماذج التقارير الديناميكية" }, desc: { en: "Design dynamic reporting models using different modelling techniques.", ar: "تصميم نماذج تقارير ديناميكية باستخدام تقنيات نمذجة مختلفة." } },
      { title: { en: "Data Integration", ar: "تكامل البيانات" }, desc: { en: "Integrate Excel with many different file types (Access, web, text, SQL).", ar: "دمج إكسل مع أنواع ملفات متعددة (Access، ويب، نصوص، SQL)." } },
      { title: { en: "Macro Automation", ar: "الأتمتة بالماكرو" }, desc: { en: "Perform repetitive tasks efficiently using macros.", ar: "تنفيذ المهام المتكررة بكفاءة باستخدام الماكرو." } },
    ],
    audienceTitle: { en: "Target Audience", ar: "الفئة المستهدفة" },
    audienceDesc: { en: "Business Unit Managers, finance and accounting professionals, senior and junior accountants, business analysts, research professionals, marketing and sales professionals, administrative staff, supervisors, general business professionals.", ar: "مدراء وحدات الأعمال، ومتخصصو المالية والمحاسبة، والمحاسبون الأول والمبتدئون، ومحللو الأعمال، ومتخصصو البحث، ومتخصصو التسويق والمبيعات، والموظفون الإداريون، والمشرفون، والمهنيون العامون في الأعمال." },
    competenciesTitle: { en: "Target Competencies", ar: "الكفاءات المستهدفة" },
    competencies: [
      { text: { en: "Massaging and Normalizing Data", ar: "معالجة وتطبيع البيانات" } },
      { text: { en: "Pivot Tables Reporting", ar: "التقارير بجداول البيفوت" } },
      { text: { en: "Modeling Techniques", ar: "تقنيات النمذجة" } },
      { text: { en: "Integration and Linking", ar: "التكامل والربط" } },
      { text: { en: "PowerQuery and Power Pivot", ar: "باور كويري وباور بيفوت" } },
      { text: { en: "Macros and Automation", ar: "الماكرو والأتمتة" } },
    ],
    contentTitle: { en: "Course Content", ar: "محتوى الدورة" },
    contentSubtitle: { en: "6 Modules • 30 Video Lessons • 5 Days of Hands-On Training", ar: "6 وحدات • 30 درس فيديو • 5 أيام تدريب عملي" },
    prerequisiteNote: { en: "This course requires a laptop with Microsoft Excel 2019 or higher installed.", ar: "تتطلب هذه الدورة جهاز لابتوب مثبت عليه Microsoft Excel 2019 أو أعلى." },
    modules: [
      {
        id: 1,
        title: { en: "Data Massaging Tools & Techniques", ar: "أدوات وتقنيات معالجة البيانات" },
        videos: [
          { num: "1.1", title: { en: "Merge & Consolidate Data", ar: "دمج وتوحيد البيانات" }, desc: { en: "Learn techniques for merging and consolidating data from multiple sources.", ar: "تعلم تقنيات دمج وتوحيد البيانات من مصادر متعددة." }, duration: "25 min" },
          { num: "1.2", title: { en: "Data Validation Techniques", ar: "تقنيات التحقق من البيانات" }, desc: { en: "Apply data validation techniques to ensure data accuracy and consistency.", ar: "تطبيق تقنيات التحقق من البيانات لضمان الدقة والاتساق." }, duration: "25 min" },
          { num: "1.3", title: { en: "Surgeon Functions (LEFT RIGHT MID)", ar: "دوال الجراحة (LEFT RIGHT MID)" }, desc: { en: "Master text functions like LEFT, RIGHT, and MID for data extraction.", ar: "إتقان الدوال النصية مثل LEFT وRIGHT وMID لاستخراج البيانات." }, duration: "25 min" },
          { num: "1.4", title: { en: "Naming & Managing Ranges", ar: "تسمية وإدارة النطاقات" }, desc: { en: "Create and manage named ranges for efficient data organization.", ar: "إنشاء وإدارة النطاقات المسماة لتنظيم البيانات بكفاءة." }, duration: "25 min" },
          { num: "1.5", title: { en: "SUM SUMIF COUNTIF & Lookups", ar: "دوال SUM وSUMIF وCOUNTIF والبحث" }, desc: { en: "Apply SUM, SUMIF, COUNTIF, and lookup functions for data analysis.", ar: "تطبيق دوال SUM وSUMIF وCOUNTIF ودوال البحث لتحليل البيانات." }, duration: "25 min" },
        ],
      },
      {
        id: 2,
        title: { en: "Pivot Tables: The One and Only", ar: "جداول البيفوت: الأداة الفريدة" },
        videos: [
          { num: "2.1", title: { en: "The 19 Rules & Design", ar: "القواعد الـ 19 والتصميم" }, desc: { en: "Learn the 19 fundamental rules for designing effective Pivot Tables.", ar: "تعلم القواعد الـ 19 الأساسية لتصميم جداول بيفوت فعّالة." }, duration: "25 min" },
          { num: "2.2", title: { en: "Number Formatting & Report Layout", ar: "تنسيق الأرقام وتخطيط التقارير" }, desc: { en: "Apply number formatting and customize report layouts in Pivot Tables.", ar: "تطبيق تنسيق الأرقام وتخصيص تخطيطات التقارير في جداول البيفوت." }, duration: "25 min" },
          { num: "2.3", title: { en: "Filtering Sorting & Navigation", ar: "التصفية والفرز والتنقل" }, desc: { en: "Master filtering, sorting, and navigation techniques in Pivot Tables.", ar: "إتقان تقنيات التصفية والفرز والتنقل في جداول البيفوت." }, duration: "25 min" },
          { num: "2.4", title: { en: "Summarizing Values & Percentages", ar: "تلخيص القيم والنسب المئوية" }, desc: { en: "Summarize values and calculate percentages within Pivot Tables.", ar: "تلخيص القيم وحساب النسب المئوية داخل جداول البيفوت." }, duration: "25 min" },
          { num: "2.5", title: { en: "Pivot Charts & Dynamic Labeling", ar: "مخططات البيفوت والتسميات الديناميكية" }, desc: { en: "Create pivot charts with dynamic labeling for interactive reporting.", ar: "إنشاء مخططات البيفوت مع تسميات ديناميكية للتقارير التفاعلية." }, duration: "25 min" },
        ],
      },
      {
        id: 3,
        title: { en: "Data Modeling", ar: "نمذجة البيانات" },
        videos: [
          { num: "3.1", title: { en: "Spinner Restrictions & Types", ar: "قيود المؤشرات الدوارة وأنواعها" }, desc: { en: "Use spinner controls with restrictions and types for dynamic models.", ar: "استخدام عناصر التحكم الدوارة مع القيود والأنواع للنماذج الديناميكية." }, duration: "25 min" },
          { num: "3.2", title: { en: "Check Box & Option Box Modeling", ar: "نمذجة مربعات الاختيار وأزرار الخيارات" }, desc: { en: "Build models using check boxes and option boxes for interactive reports.", ar: "بناء نماذج باستخدام مربعات الاختيار وأزرار الخيارات للتقارير التفاعلية." }, duration: "25 min" },
          { num: "3.3", title: { en: "List Box Modeling with CHOOSE", ar: "نمذجة مربع القائمة مع دالة CHOOSE" }, desc: { en: "Create list box models using the CHOOSE function for dynamic selection.", ar: "إنشاء نماذج مربع القائمة باستخدام دالة CHOOSE للاختيار الديناميكي." }, duration: "25 min" },
          { num: "3.4", title: { en: "What-If Analysis & Goal Seek", ar: "تحليل ماذا لو والبحث عن الهدف" }, desc: { en: "Perform what-if analysis and use Goal Seek for target-based modeling.", ar: "إجراء تحليل ماذا لو واستخدام البحث عن الهدف للنمذجة القائمة على الأهداف." }, duration: "25 min" },
          { num: "3.5", title: { en: "Scenario Manager & Data Tables", ar: "مدير السيناريوهات وجداول البيانات" }, desc: { en: "Utilize Scenario Manager and data tables for multi-scenario analysis.", ar: "استخدام مدير السيناريوهات وجداول البيانات لتحليل السيناريوهات المتعددة." }, duration: "25 min" },
        ],
      },
      {
        id: 4,
        title: { en: "Data Integration Using PowerQuery", ar: "تكامل البيانات باستخدام باور كويري" },
        videos: [
          { num: "4.1", title: { en: "Get Data from Text Files", ar: "استيراد البيانات من الملفات النصية" }, desc: { en: "Import and transform data from text and CSV files using PowerQuery.", ar: "استيراد وتحويل البيانات من الملفات النصية وCSV باستخدام باور كويري." }, duration: "25 min" },
          { num: "4.2", title: { en: "Linking with Databases", ar: "الربط مع قواعد البيانات" }, desc: { en: "Connect and link Excel with Access and SQL databases via PowerQuery.", ar: "ربط إكسل مع قواعد بيانات Access وSQL عبر باور كويري." }, duration: "25 min" },
          { num: "4.3", title: { en: "Linking with Multiple Excel Files", ar: "الربط مع ملفات إكسل متعددة" }, desc: { en: "Consolidate data from multiple Excel files using PowerQuery.", ar: "توحيد البيانات من ملفات إكسل متعددة باستخدام باور كويري." }, duration: "25 min" },
          { num: "4.4", title: { en: "Data Transformation Techniques", ar: "تقنيات تحويل البيانات" }, desc: { en: "Apply advanced data transformation techniques in PowerQuery.", ar: "تطبيق تقنيات تحويل البيانات المتقدمة في باور كويري." }, duration: "25 min" },
          { num: "4.5", title: { en: "Automatic Refresh of Data", ar: "التحديث التلقائي للبيانات" }, desc: { en: "Set up automatic data refresh schedules for connected data sources.", ar: "إعداد جداول التحديث التلقائي للبيانات لمصادر البيانات المتصلة." }, duration: "25 min" },
        ],
      },
      {
        id: 5,
        title: { en: "Advanced Reporting Using Power Pivot", ar: "التقارير المتقدمة باستخدام باور بيفوت" },
        videos: [
          { num: "5.1", title: { en: "ETL Extract Load Transform", ar: "استخراج وتحميل وتحويل البيانات ETL" }, desc: { en: "Master the ETL process for extracting, loading, and transforming data.", ar: "إتقان عملية ETL لاستخراج وتحميل وتحويل البيانات." }, duration: "25 min" },
          { num: "5.2", title: { en: "Data from Various Sources", ar: "البيانات من مصادر متنوعة" }, desc: { en: "Import data from various sources into Power Pivot data models.", ar: "استيراد البيانات من مصادر متنوعة إلى نماذج بيانات باور بيفوت." }, duration: "25 min" },
          { num: "5.3", title: { en: "Transform Data Using PowerQuery", ar: "تحويل البيانات باستخدام باور كويري" }, desc: { en: "Transform and shape data using PowerQuery before loading into models.", ar: "تحويل وتشكيل البيانات باستخدام باور كويري قبل تحميلها في النماذج." }, duration: "25 min" },
          { num: "5.4", title: { en: "Create & Manage Relationships", ar: "إنشاء وإدارة العلاقات" }, desc: { en: "Create and manage relationships between tables in Power Pivot.", ar: "إنشاء وإدارة العلاقات بين الجداول في باور بيفوت." }, duration: "25 min" },
          { num: "5.5", title: { en: "Advanced PowerPivot Reporting", ar: "التقارير المتقدمة بباور بيفوت" }, desc: { en: "Build advanced reports using Power Pivot measures and calculated fields.", ar: "بناء تقارير متقدمة باستخدام مقاييس باور بيفوت والحقول المحسوبة." }, duration: "25 min" },
        ],
      },
      {
        id: 6,
        title: { en: "Automation Using Macros", ar: "الأتمتة باستخدام الماكرو" },
        videos: [
          { num: "6.1", title: { en: "Macro Basics & Planning", ar: "أساسيات الماكرو والتخطيط" }, desc: { en: "Understand macro basics and plan automation strategies for repetitive tasks.", ar: "فهم أساسيات الماكرو والتخطيط لاستراتيجيات الأتمتة للمهام المتكررة." }, duration: "25 min" },
          { num: "6.2", title: { en: "Recording a Macro", ar: "تسجيل ماكرو" }, desc: { en: "Record macros to automate common Excel operations and workflows.", ar: "تسجيل الماكرو لأتمتة عمليات ومسارات عمل إكسل الشائعة." }, duration: "25 min" },
          { num: "6.3", title: { en: "Testing & Editing Macros", ar: "اختبار وتحرير الماكرو" }, desc: { en: "Test, debug, and edit recorded macros for optimal performance.", ar: "اختبار وتصحيح وتحرير الماكرو المسجلة للأداء الأمثل." }, duration: "25 min" },
          { num: "6.4", title: { en: "Relative Reference Macros", ar: "ماكرو المرجع النسبي" }, desc: { en: "Create macros using relative references for flexible automation.", ar: "إنشاء ماكرو باستخدام المراجع النسبية للأتمتة المرنة." }, duration: "25 min" },
          { num: "6.5", title: { en: "Advanced Filter with Macros", ar: "التصفية المتقدمة مع الماكرو" }, desc: { en: "Combine advanced filtering techniques with macros for powerful data extraction.", ar: "الجمع بين تقنيات التصفية المتقدمة والماكرو لاستخراج البيانات القوي." }, duration: "25 min" },
        ],
      },
    ],
  },
};
