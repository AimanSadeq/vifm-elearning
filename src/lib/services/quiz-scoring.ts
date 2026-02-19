import type { QuestionType } from "@/types";

export interface QuestionData {
  id: string;
  question_type: QuestionType;
  points: number;
  options: { id: string; is_correct: boolean }[];
}

export interface AnswerData {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  maxPoints: number;
}

export interface QuizScoreResult {
  score: number;
  maxScore: number;
  percentage: number;
  questionResults: QuestionResult[];
}

export function scoreQuizAttempt(
  questions: QuestionData[],
  answers: AnswerData[]
): QuizScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const questionResults: QuestionResult[] = [];
  let score = 0;
  let maxScore = 0;

  for (const question of questions) {
    const answer = answerMap.get(question.id);
    const maxPoints = question.points;
    maxScore += maxPoints;

    if (!answer) {
      questionResults.push({
        questionId: question.id,
        correct: false,
        pointsEarned: 0,
        maxPoints,
      });
      continue;
    }

    let correct = false;

    switch (question.question_type) {
      case "multiple_choice":
      case "true_false": {
        const correctOptionIds = question.options
          .filter((o) => o.is_correct)
          .map((o) => o.id);
        const selected = answer.selectedOptionIds ?? [];
        correct =
          selected.length === 1 && correctOptionIds.includes(selected[0]);
        break;
      }

      case "multi_select": {
        const correctSet = new Set(
          question.options.filter((o) => o.is_correct).map((o) => o.id)
        );
        const selectedSet = new Set(answer.selectedOptionIds ?? []);
        correct =
          correctSet.size === selectedSet.size &&
          Array.from(correctSet).every((id) => selectedSet.has(id));
        break;
      }

      case "short_answer": {
        // Short answer: marked correct if any correct option text matches (case-insensitive, trimmed)
        const userText = (answer.textAnswer ?? "").trim().toLowerCase();
        correct = question.options.some(
          (o) =>
            o.is_correct &&
            (o as unknown as { option_text: string }).option_text
              ?.trim()
              .toLowerCase() === userText
        );
        break;
      }
    }

    const pointsEarned = correct ? maxPoints : 0;
    score += pointsEarned;

    questionResults.push({
      questionId: question.id,
      correct,
      pointsEarned,
      maxPoints,
    });
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return { score, maxScore, percentage, questionResults };
}
