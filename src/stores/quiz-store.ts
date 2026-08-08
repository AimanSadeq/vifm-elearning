import { create } from "zustand";

interface QuizAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  /** Matching questions: prompt option id -> chosen right-hand item handle. */
  matches?: Record<string, string>;
}

interface QuizState {
  answers: Record<string, QuizAnswer>;
  currentQuestionIndex: number;
  timeRemaining: number | null;
  isSubmitting: boolean;
  isSubmitted: boolean;

  setAnswer: (questionId: string, answer: Partial<QuizAnswer>) => void;
  setCurrentQuestion: (index: number) => void;
  setTimeRemaining: (seconds: number | null) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitted: (submitted: boolean) => void;
  reset: () => void;
  getAnswersArray: () => QuizAnswer[];
}

export const useQuizStore = create<QuizState>((set, get) => ({
  answers: {},
  currentQuestionIndex: 0,
  timeRemaining: null,
  isSubmitting: false,
  isSubmitted: false,

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          ...answer,
          questionId,
        },
      },
    })),

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitted: (isSubmitted) => set({ isSubmitted }),

  reset: () =>
    set({
      answers: {},
      currentQuestionIndex: 0,
      timeRemaining: null,
      isSubmitting: false,
      isSubmitted: false,
    }),

  getAnswersArray: () => Object.values(get().answers),
}));
