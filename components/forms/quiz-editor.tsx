"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { QuizDeleteButton } from "@/components/forms/quiz-delete-button";

const MAX_CHOICES = 6;

type QuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

type EditableChoice = {
  id: string;
  label: string;
  value: string;
};

type EditableQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  difficulty: Difficulty;
  explanation: string;
  choices: EditableChoice[];
  correctAnswer: string;
};

type EditableState = {
  title: string;
  questions: EditableQuestion[];
};

interface QuizEditorProps {
  quiz: {
    id: string;
    title: string;
    updatedAt: string;
    questions: Array<{
      id: string;
      prompt: string;
      type: QuestionType;
      difficulty: Difficulty;
      explanation: string;
      choices: Array<{ id?: string; label: string; value: string }>;
      correctAnswer: string;
    }>;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const choiceId = () => crypto.randomUUID?.() ?? `choice-${Math.random().toString(36).slice(2)}`;

const ensureChoiceLabels = (choices: EditableChoice[]): EditableChoice[] =>
  choices.map((choice, index) => ({ ...choice, label: String.fromCharCode(65 + index) }));

const createBlankChoices = (length = 4): EditableChoice[] =>
  Array.from({ length }, (_, index) => ({
    id: choiceId(),
    label: String.fromCharCode(65 + index),
    value: "",
  }));

const buildEditableState = (quiz: QuizEditorProps["quiz"]): EditableState => ({
  title: quiz.title,
  questions: quiz.questions.map((question) => {
    const safeChoices = question.type === "MULTIPLE_CHOICE"
      ? ensureChoiceLabels(
          (question.choices.length > 0 ? question.choices : createBlankChoices()).map((choice, choiceIndex) => ({
            id: choice.id ?? choiceId(),
            label: choice.label ?? String.fromCharCode(65 + choiceIndex),
            value: choice.value ?? "",
          }))
        )
      : [];

    const correctAnswer = question.type === "MULTIPLE_CHOICE"
      ? (question.correctAnswer && safeChoices.find((choice) => normalize(choice.value) === normalize(question.correctAnswer))?.value) ?? safeChoices[0]?.value ?? ""
      : question.correctAnswer;

    return {
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      explanation: question.explanation,
      choices: safeChoices,
      correctAnswer,
    } satisfies EditableQuestion;
  }),
});

const cloneState = (state: EditableState): EditableState => ({
  title: state.title,
  questions: state.questions.map((question) => ({
    ...question,
    choices: question.choices.map((choice) => ({ ...choice })),
  })),
});

const normalize = (value: string) => value.trim().toLowerCase();

export function QuizEditor({ quiz }: QuizEditorProps) {
  const router = useRouter();
  const initialState = useMemo(() => buildEditableState(quiz), [quiz]);
  const [state, setState] = useState<EditableState>(initialState);
  const baselineRef = useRef<EditableState>(cloneState(initialState));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(initialState);
    baselineRef.current = cloneState(initialState);
  }, [initialState]);

  const isDirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(baselineRef.current), [state]);

  const setQuestions = (updater: (questions: EditableQuestion[]) => EditableQuestion[]) => {
    setState((prev) => ({ ...prev, questions: updater(prev.questions) }));
  };

  const handlePromptChange = (questionId: string, value: string) => {
    setQuestions((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, prompt: value } : question))
    );
  };

  const handleExplanationChange = (questionId: string, value: string) => {
    setQuestions((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, explanation: value } : question))
    );
  };

  const handleDifficultyChange = (questionId: string, value: Difficulty) => {
    setQuestions((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, difficulty: value } : question))
    );
  };

  const handleTypeChange = (questionId: string, nextType: QuestionType) => {
    setQuestions((questions) =>
      questions.map((question) => {
        if (question.id !== questionId) return question;
        if (question.type === nextType) return question;
        if (nextType === "SHORT_ANSWER") {
          return { ...question, type: nextType, choices: [], correctAnswer: "" };
        }
        const paddedChoices = ensureChoiceLabels(
          (question.choices.length > 0 ? question.choices : createBlankChoices()).map((choice, index) => ({
            id: choice.id ?? choiceId(),
            label: choice.label ?? String.fromCharCode(65 + index),
            value: choice.value ?? "",
          }))
        );
        return {
          ...question,
          type: nextType,
          choices: paddedChoices,
          correctAnswer: paddedChoices[0]?.value ?? "",
        };
      })
    );
  };

  const handleChoiceValueChange = (questionId: string, choiceIdValue: string, value: string) => {
    setQuestions((questions) =>
      questions.map((question) => {
        if (question.id !== questionId) return question;
        const updatedChoices = ensureChoiceLabels(
          question.choices.map((choice) => (choice.id === choiceIdValue ? { ...choice, value } : choice))
        );
        const updatedCorrect = updatedChoices.find((choice) => choice.value === question.correctAnswer)
          ? question.correctAnswer
          : updatedChoices[0]?.value ?? "";
        return { ...question, choices: updatedChoices, correctAnswer: updatedCorrect };
      })
    );
  };

  const handleAddChoice = (questionId: string) => {
    setQuestions((questions) =>
      questions.map((question) => {
        if (question.id !== questionId) return question;
        if (question.choices.length >= MAX_CHOICES) return question;
        const nextChoices = ensureChoiceLabels([...question.choices, ...createBlankChoices(1)]);
        return { ...question, choices: nextChoices };
      })
    );
  };

  const handleRemoveChoice = (questionId: string, choiceIdValue: string) => {
    setQuestions((questions) =>
      questions.map((question) => {
        if (question.id !== questionId) return question;
        if (question.choices.length <= 2) return question;
        const filtered = ensureChoiceLabels(question.choices.filter((choice) => choice.id !== choiceIdValue));
        const nextCorrect = filtered.find((choice) => choice.value === question.correctAnswer)?.value ?? filtered[0]?.value ?? "";
        return { ...question, choices: filtered, correctAnswer: nextCorrect };
      })
    );
  };

  const handleCorrectChoiceChange = (questionId: string, value: string) => {
    setQuestions((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, correctAnswer: value } : question))
    );
  };

  const handleShortAnswerChange = (questionId: string, value: string) => {
    setQuestions((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, correctAnswer: value } : question))
    );
  };

  const formatShortAnswerPayload = (value: string) => {
    const answers = value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (answers.length === 0) {
      return "";
    }
    if (answers.length === 1) {
      return answers[0];
    }
    return answers;
  };

  const validateState = (snapshot: EditableState): string | null => {
    if (!snapshot.title.trim()) {
      return "Quiz title is required.";
    }
    for (const [index, question] of snapshot.questions.entries()) {
      if (!question.prompt.trim()) {
        return `Question ${index + 1} is missing a prompt.`;
      }
      if (!question.explanation.trim()) {
        return `Question ${index + 1} needs an explanation.`;
      }
      if (question.type === "MULTIPLE_CHOICE") {
        if (question.choices.some((choice) => !choice.value.trim())) {
          return `All choices for question ${index + 1} need text.`;
        }
        if (!question.correctAnswer.trim()) {
          return `Select the correct answer for question ${index + 1}.`;
        }
      } else if (!question.correctAnswer.trim()) {
        return `Enter at least one correct answer for question ${index + 1}.`;
      }
    }
    return null;
  };

  const handleReset = () => {
    setState(cloneState(baselineRef.current));
    setError(null);
    setStatus(null);
  };

  const handleSave = () => {
    const snapshot = cloneState(state);
    const validationError = validateState(snapshot);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStatus(null);
    const payload = {
      title: snapshot.title.trim(),
      questions: snapshot.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt.trim(),
        type: question.type,
        difficulty: question.difficulty,
        explanation: question.explanation.trim(),
        choices:
          question.type === "MULTIPLE_CHOICE"
            ? question.choices.map((choice) => ({ label: choice.label, value: choice.value.trim() }))
            : undefined,
        correctAnswer:
          question.type === "MULTIPLE_CHOICE"
            ? question.correctAnswer.trim()
            : formatShortAnswerPayload(question.correctAnswer),
      })),
    } as const;

    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as unknown;
      if (!response.ok) {
        setStatus(null);
        setError(getErrorMessage(result, "Changes could not be saved."));
        return;
      }

      baselineRef.current = snapshot;
      setError(null);
      setStatus("Saved");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted" htmlFor="quiz-title">
            Quiz title
          </label>
          <Input
            id="quiz-title"
            value={state.title}
            onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Edit the title"
          />
          <p className="text-xs text-text-muted">
            Last updated {new Date(quiz.updatedAt).toLocaleString()} · {state.questions.length} questions
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryButton type="button" onClick={handleSave} disabled={!isDirty || isPending}>
            {isPending ? "Saving…" : isDirty ? "Save changes" : "All changes saved"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={handleReset} disabled={!isDirty || isPending}>
            Reset
          </SecondaryButton>
          <QuizDeleteButton quizId={quiz.id} label="Delete quiz" redirectTo="/dashboard" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {state.questions.map((question, index) => (
          <a
            key={question.id}
            href={`#question-${question.id}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
              "border-border-subtle/70 text-text-muted hover:border-accent",
              index % 2 === 0 && "bg-bg-soft/60"
            )}
          >
            Q{index + 1}
          </a>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {status && <p className="text-sm text-green-600">{status}</p>}

      <div className="space-y-8">
        {state.questions.map((question, index) => (
          <section
            key={question.id}
            id={`question-${question.id}`}
            className="rounded-3xl border border-border-subtle/70 bg-bg-soft/60 px-5 py-6 shadow-inner shadow-black/5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Question {index + 1}</p>
                <p className="text-lg font-semibold text-text-main">{question.prompt.slice(0, 80) || "Untitled question"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {["MULTIPLE_CHOICE", "SHORT_ANSWER"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleTypeChange(question.id, option as QuestionType)}
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                      question.type === option ? "bg-text-main text-white" : "bg-white/40 text-text-muted"
                    )}
                  >
                    {option === "MULTIPLE_CHOICE" ? "Multiple choice" : "Short answer"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-text-main">Prompt</label>
                <TextArea
                  rows={4}
                  className="mt-2"
                  value={question.prompt}
                  onChange={(event) => handlePromptChange(question.id, event.target.value)}
                  placeholder="Rewrite the question in your own words"
                />
              </div>

              {question.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-main">Answer choices</p>
                    <p className="text-xs text-text-muted">Pick the correct option using the radio buttons.</p>
                  </div>
                  <div className="space-y-3">
                    {question.choices.map((choice) => (
                      <div
                        key={choice.id}
                        className="flex flex-col gap-2 rounded-2xl border border-border-subtle/70 bg-white/60 p-3 sm:flex-row sm:items-center"
                      >
                        <label className="flex items-center gap-3 text-sm font-medium text-text-main">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            value={choice.value}
                            checked={question.correctAnswer === choice.value}
                            onChange={() => handleCorrectChoiceChange(question.id, choice.value)}
                            className="h-4 w-4 accent-accent"
                          />
                          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-text-muted">
                            {choice.label}
                          </span>
                        </label>
                        <Input
                          value={choice.value}
                          onChange={(event) => handleChoiceValueChange(question.id, choice.id, event.target.value)}
                          placeholder="Choice text"
                        />
                        <GhostButton
                          type="button"
                          onClick={() => handleRemoveChoice(question.id, choice.id)}
                          disabled={question.choices.length <= 2}
                          className="text-xs"
                        >
                          Remove
                        </GhostButton>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SecondaryButton
                      type="button"
                      onClick={() => handleAddChoice(question.id)}
                      disabled={question.choices.length >= MAX_CHOICES}
                    >
                      Add choice
                    </SecondaryButton>
                    <p className="text-xs text-text-muted">
                      {question.choices.length}/{MAX_CHOICES} options
                    </p>
                  </div>
                </div>
              )}

              {question.type === "SHORT_ANSWER" && (
                <div>
                  <label className="text-sm font-medium text-text-main">Accepted answers</label>
                  <TextArea
                    rows={3}
                    className="mt-2"
                    value={question.correctAnswer}
                    onChange={(event) => handleShortAnswerChange(question.id, event.target.value)}
                    placeholder="Separate multiple answers with commas or new lines"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-main">Difficulty</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-border-subtle/70 bg-white/70 px-4 py-3 text-sm text-text-main"
                    value={question.difficulty}
                    onChange={(event) => handleDifficultyChange(question.id, event.target.value as Difficulty)}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-main">Explanation</label>
                  <TextArea
                    rows={3}
                    className="mt-2"
                    value={question.explanation}
                    onChange={(event) => handleExplanationChange(question.id, event.target.value)}
                    placeholder="Give the learner some coaching"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
