"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Star, ListChecks, AlignLeft, Smile, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseSurveyModal } from "@/components/learner/CourseSurveyModal";
import type {
  CourseSurvey,
  SurveyOptions,
  SurveyQuestion,
  SurveyQuestionType,
} from "@/types/survey";

interface Props {
  courseId: string;
}

const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  rating: "Star Rating (1–5)",
  multiple_choice: "Multiple Choice",
  free_text: "Free Text",
  nps: "NPS (0–10)",
};

const QUESTION_TYPE_ICONS: Record<
  SurveyQuestionType,
  React.ComponentType<{ className?: string }>
> = {
  rating: Star,
  multiple_choice: ListChecks,
  free_text: AlignLeft,
  nps: Smile,
};

export function SurveyBuilder({ courseId }: Props) {
  const [survey, setSurvey] = useState<CourseSurvey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}/surveys`);
    const j = await res.json();
    setSurvey(j.data ?? null);
    setQuestions(j.questions ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const createSurvey = async () => {
    const res = await fetch(`/api/admin/courses/${courseId}/surveys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Course Feedback",
        title_ar: "تقييم الدورة",
        description:
          "Help us improve share your experience with this course.",
        is_required: true,
        is_active: true,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "Failed to create survey");
      return;
    }
    toast.success("Survey created");
    load();
  };

  const saveSurveyMeta = async (patch: Partial<CourseSurvey>) => {
    const res = await fetch(`/api/admin/courses/${courseId}/surveys`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    const j = await res.json();
    setSurvey(j.data);
  };

  const deleteSurvey = async () => {
    if (
      !confirm(
        "Delete the entire survey for this course? All learner responses will be deleted."
      )
    )
      return;
    const res = await fetch(`/api/admin/courses/${courseId}/surveys`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Survey deleted");
    setSurvey(null);
    setQuestions([]);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(
      `/api/admin/courses/${courseId}/surveys/questions/${questionId}`,
      { method: "DELETE" }
    );
    load();
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!survey) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No survey configured for this course yet.
          </p>
          <Button onClick={createSurvey}>
            <Plus className="h-4 w-4 me-2" />
            Create Survey
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SurveyMetaForm
        survey={survey}
        onSave={saveSurveyMeta}
        onDelete={deleteSurvey}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Questions ({questions.length})
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={questions.length === 0}
              onClick={() => setPreviewOpen(true)}
              title={
                questions.length === 0
                  ? "Add at least one question to preview"
                  : "Preview survey as a learner sees it"
              }
            >
              <Eye className="h-4 w-4 me-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionForm(true);
              }}
            >
              <Plus className="h-4 w-4 me-1" />
              Add Question
            </Button>
          </div>
        </div>

        {showQuestionForm && (
          <QuestionEditor
            courseId={courseId}
            initial={editingQuestion}
            onClose={() => {
              setShowQuestionForm(false);
              setEditingQuestion(null);
            }}
            onSaved={() => {
              setShowQuestionForm(false);
              setEditingQuestion(null);
              load();
            }}
          />
        )}

        {questions.map((q, idx) => {
          const Icon = QUESTION_TYPE_ICONS[q.question_type];
          return (
            <Card key={q.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        Q{idx + 1}. {q.question_text}
                      </p>
                      {q.question_text_ar && (
                        <p
                          className="text-sm text-muted-foreground"
                          dir="rtl"
                        >
                          {q.question_text_ar}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <UiBadge variant="secondary" className="text-xs">
                          {QUESTION_TYPE_LABELS[q.question_type]}
                        </UiBadge>
                        {q.is_required && (
                          <UiBadge variant="outline" className="text-xs">
                            Required
                          </UiBadge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingQuestion(q);
                          setShowQuestionForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {q.question_type === "multiple_choice" &&
                    q.options?.choices && (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {q.options.choices.map((c, i) => (
                          <li key={i}>
                            ○ {c.label}
                            {c.label_ar ? ` / ${c.label_ar}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  {q.question_type === "nps" && q.options?.follow_up_text && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Follow-up: {q.options.follow_up_text}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {questions.length === 0 && !showQuestionForm && (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No questions yet. Click &quot;Add Question&quot; to get started.
          </div>
        )}
      </div>

      {previewOpen && (
        <CourseSurveyModal
          courseId={courseId}
          required={false}
          onSubmitted={() => setPreviewOpen(false)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function SurveyMetaForm({
  survey,
  onSave,
  onDelete,
}: {
  survey: CourseSurvey;
  onSave: (patch: Partial<CourseSurvey>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(survey.title ?? "");
  const [titleAr, setTitleAr] = useState(survey.title_ar ?? "");
  const [description, setDescription] = useState(survey.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(
    survey.description_ar ?? ""
  );
  const [isRequired, setIsRequired] = useState(survey.is_required);
  const [isActive, setIsActive] = useState(survey.is_active);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Title (EN)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Title (AR)</Label>
            <Input
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (EN)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (AR)</Label>
            <Textarea
              rows={2}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4"
            />
            Required (blocks certificate &amp; badge until submitted)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            Active
          </label>
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 me-2" />
            Delete Survey
          </Button>
          <Button
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              await onSave({
                title: title || null,
                title_ar: titleAr || null,
                description: description || null,
                description_ar: descriptionAr || null,
                is_required: isRequired,
                is_active: isActive,
              });
              setIsSaving(false);
              toast.success("Saved");
            }}
          >
            {isSaving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionEditor({
  courseId,
  initial,
  onClose,
  onSaved,
}: {
  courseId: string;
  initial: SurveyQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [questionType, setQuestionType] = useState<SurveyQuestionType>(
    initial?.question_type ?? "rating"
  );
  const [questionText, setQuestionText] = useState(initial?.question_text ?? "");
  const [questionTextAr, setQuestionTextAr] = useState(
    initial?.question_text_ar ?? ""
  );
  const [isRequired, setIsRequired] = useState(initial?.is_required ?? true);
  const [choices, setChoices] = useState<{ label: string; label_ar?: string }[]>(
    initial?.options?.choices ?? [{ label: "" }, { label: "" }]
  );
  const [followUp, setFollowUp] = useState(
    initial?.options?.follow_up_text ?? "Why?"
  );
  const [followUpAr, setFollowUpAr] = useState(
    initial?.options?.follow_up_text_ar ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    const options: SurveyOptions = {};
    if (questionType === "multiple_choice") {
      const cleaned = choices.filter((c) => c.label.trim());
      if (cleaned.length < 2) {
        toast.error("Multiple choice needs at least 2 options");
        return;
      }
      options.choices = cleaned;
    } else if (questionType === "nps") {
      options.follow_up_text = followUp || undefined;
      options.follow_up_text_ar = followUpAr || undefined;
    }

    setIsSaving(true);
    const url = initial
      ? `/api/admin/courses/${courseId}/surveys/questions/${initial.id}`
      : `/api/admin/courses/${courseId}/surveys/questions`;
    const res = await fetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: questionText,
        question_text_ar: questionTextAr || null,
        question_type: questionType,
        options: Object.keys(options).length ? options : null,
        is_required: isRequired,
      }),
    });
    setIsSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Failed to save");
      return;
    }
    onSaved();
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">
            {initial ? "Edit Question" : "New Question"}
          </h4>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Question Type</Label>
          <select
            value={questionType}
            onChange={(e) =>
              setQuestionType(e.target.value as SurveyQuestionType)
            }
            disabled={Boolean(initial)}
            className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="rating">Star Rating (1–5)</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="free_text">Free Text</option>
            <option value="nps">NPS (0–10 with follow-up)</option>
          </select>
          {initial && (
            <p className="text-xs text-muted-foreground">
              Type cannot be changed after creation delete and recreate if
              needed.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Question (EN) *</Label>
            <Textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Question (AR)</Label>
            <Textarea
              rows={2}
              value={questionTextAr}
              onChange={(e) => setQuestionTextAr(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        {questionType === "multiple_choice" && (
          <div className="space-y-2">
            <Label>Choices</Label>
            <div className="space-y-2">
              {choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={c.label}
                    placeholder={`Choice ${i + 1} (EN)`}
                    onChange={(e) => {
                      const next = [...choices];
                      next[i] = { ...next[i], label: e.target.value };
                      setChoices(next);
                    }}
                  />
                  <Input
                    value={c.label_ar ?? ""}
                    dir="rtl"
                    placeholder={`Choice ${i + 1} (AR)`}
                    onChange={(e) => {
                      const next = [...choices];
                      next[i] = { ...next[i], label_ar: e.target.value };
                      setChoices(next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() =>
                      setChoices(choices.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChoices([...choices, { label: "" }])}
            >
              <Plus className="h-4 w-4 me-1" />
              Add choice
            </Button>
          </div>
        )}

        {questionType === "nps" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Follow-up prompt (EN)</Label>
              <Input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Why?"
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-up prompt (AR)</Label>
              <Input
                value={followUpAr}
                onChange={(e) => setFollowUpAr(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4"
          />
          Required
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving…" : initial ? "Update" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
