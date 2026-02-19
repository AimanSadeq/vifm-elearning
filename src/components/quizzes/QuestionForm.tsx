"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { QuestionType } from "@/types";

interface OptionInput {
  optionText: string;
  optionTextAr: string;
  isCorrect: boolean;
}

interface QuestionFormData {
  questionText: string;
  questionTextAr: string;
  questionType: QuestionType;
  points: number;
  explanation: string;
  explanationAr: string;
  options: OptionInput[];
}

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData>;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "short_answer", label: "Short Answer" },
];

const DEFAULT_TRUE_FALSE_OPTIONS: OptionInput[] = [
  { optionText: "True", optionTextAr: "صحيح", isCorrect: true },
  { optionText: "False", optionTextAr: "خطأ", isCorrect: false },
];

export function QuestionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(
    initialData?.questionText ?? ""
  );
  const [questionTextAr, setQuestionTextAr] = useState(
    initialData?.questionTextAr ?? ""
  );
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.questionType ?? "multiple_choice"
  );
  const [points, setPoints] = useState(initialData?.points ?? 1);
  const [explanation, setExplanation] = useState(
    initialData?.explanation ?? ""
  );
  const [explanationAr, setExplanationAr] = useState(
    initialData?.explanationAr ?? ""
  );
  const [options, setOptions] = useState<OptionInput[]>(
    initialData?.options ??
      (initialData?.questionType === "true_false"
        ? DEFAULT_TRUE_FALSE_OPTIONS
        : [
            { optionText: "", optionTextAr: "", isCorrect: false },
            { optionText: "", optionTextAr: "", isCorrect: false },
          ])
  );

  const showOptions = questionType !== "short_answer";

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    if (type === "true_false") {
      setOptions(DEFAULT_TRUE_FALSE_OPTIONS);
    } else if (type === "short_answer") {
      // For short answer, keep one "option" as the accepted answer
      setOptions([{ optionText: "", optionTextAr: "", isCorrect: true }]);
    }
  };

  const addOption = () => {
    setOptions([
      ...options,
      { optionText: "", optionTextAr: "", isCorrect: false },
    ]);
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: keyof OptionInput, value: string | boolean) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: value };

    // For single-choice, uncheck others when one is checked
    if (
      field === "isCorrect" &&
      value === true &&
      (questionType === "multiple_choice" || questionType === "true_false")
    ) {
      updated.forEach((opt, i) => {
        if (i !== idx) opt.isCorrect = false;
      });
    }

    setOptions(updated);
  };

  const handleFormSubmit = () => {
    onSubmit({
      questionText,
      questionTextAr,
      questionType,
      points,
      explanation,
      explanationAr,
      options,
    });
  };

  return (
    <Card>
      <CardHeader>
        <h4 className="font-semibold">
          {initialData ? "Edit Question" : "Add Question"}
        </h4>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Type */}
        <div className="space-y-2">
          <Label>Question Type</Label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((type) => (
              <Button
                key={type.value}
                type="button"
                size="sm"
                variant={questionType === type.value ? "default" : "outline"}
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Question (English)</Label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Question (Arabic)</Label>
            <Textarea
              dir="rtl"
              value={questionTextAr}
              onChange={(e) => setQuestionTextAr(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Points */}
        <div className="w-32 space-y-2">
          <Label>Points</Label>
          <Input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            min={0}
          />
        </div>

        {/* Options */}
        {showOptions && (
          <div className="space-y-3">
            <Label>
              {questionType === "true_false" ? "Answers" : "Options"}
            </Label>
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-md border p-3"
              >
                <input
                  type={
                    questionType === "multi_select" ? "checkbox" : "radio"
                  }
                  checked={opt.isCorrect}
                  onChange={(e) =>
                    updateOption(idx, "isCorrect", e.target.checked)
                  }
                  name="correct-option"
                  className="mt-2.5"
                />
                <div className="flex-1 grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Option text (EN)"
                    value={opt.optionText}
                    onChange={(e) =>
                      updateOption(idx, "optionText", e.target.value)
                    }
                    disabled={questionType === "true_false"}
                  />
                  <Input
                    placeholder="Option text (AR)"
                    dir="rtl"
                    value={opt.optionTextAr}
                    onChange={(e) =>
                      updateOption(idx, "optionTextAr", e.target.value)
                    }
                    disabled={questionType === "true_false"}
                  />
                </div>
                {questionType !== "true_false" && options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => removeOption(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {questionType !== "true_false" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 me-1" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* Short answer accepted answers */}
        {!showOptions && (
          <div className="space-y-2">
            <Label>Accepted Answer(s)</Label>
            <p className="text-xs text-muted-foreground">
              Enter one or more accepted answers. The student&apos;s answer will
              be matched case-insensitively.
            </p>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Accepted answer"
                  value={opt.optionText}
                  onChange={(e) =>
                    updateOption(idx, "optionText", e.target.value)
                  }
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 me-1" />
              Add Accepted Answer
            </Button>
          </div>
        )}

        {/* Explanation */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Explanation (English)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Shown after quiz completion"
            />
          </div>
          <div className="space-y-2">
            <Label>Explanation (Arabic)</Label>
            <Textarea
              dir="rtl"
              value={explanationAr}
              onChange={(e) => setExplanationAr(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={isLoading || !questionText}
          >
            {isLoading ? "Saving..." : initialData ? "Update" : "Add Question"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
