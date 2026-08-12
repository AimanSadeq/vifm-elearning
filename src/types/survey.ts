export type SurveyQuestionType =
  | "rating"
  | "multiple_choice"
  | "free_text"
  | "nps";

/**
 * completion = post-course survey (gates cert/badge until submitted).
 * followup   = Kirkpatrick Level 3 behavior survey, invited ~90 days after
 *              a training assignment is completed.
 */
export type SurveyKind = "completion" | "followup";

export interface SurveyChoice {
  label: string;
  label_ar?: string;
}

export interface SurveyOptions {
  // multiple_choice
  choices?: SurveyChoice[];
  // nps
  follow_up_text?: string;
  follow_up_text_ar?: string;
}

export interface CourseSurvey {
  id: string;
  course_id: string;
  survey_kind: SurveyKind;
  title: string | null;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_text_ar: string | null;
  question_type: SurveyQuestionType;
  options: SurveyOptions | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Shape varies by question_type — caller validates per type:
//   rating         -> number 1..5
//   multiple_choice-> string (the chosen choice label) | number (index)
//   free_text      -> string
//   nps            -> { score: number 0..10, reason?: string }
export type SurveyAnswerValue =
  | number
  | string
  | { score: number; reason?: string };

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  enrollment_id: string | null;
  answers: SurveyAnswers;
  edit_count: number;
  submitted_at: string;
  updated_at: string;
}

export interface SurveyAggregate {
  questionId: string;
  questionType: SurveyQuestionType;
  responseCount: number;
  // rating + nps only
  average?: number;
  // nps specifically
  npsScore?: number; // promoters% - detractors%
  // multiple_choice
  distribution?: Record<string, number>;
  // free_text
  sampleResponses?: string[];
}
