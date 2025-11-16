"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { TextArea } from "@/components/ui/textarea";
import { clsx } from "clsx";

interface Choice {
  label: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  choices?: Choice[] | null;
  difficulty: string;
}

interface QuizRunnerProps {
  quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
  };
  attemptPath?: string;
}

type AnswerPayload = {
  userAnswer: string | string[] | Record<string, string>;
  confidence?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload)) {
    const maybeError = payload.error;
    if (typeof maybeError === "string" && maybeError.trim()) {
      return maybeError;
    }
  }
  return fallback;
};

const isAttemptResponse = (payload: unknown): payload is { attemptId: string } =>
  isRecord(payload) && typeof payload.attemptId === "string" && payload.attemptId.length > 0;

const confidenceMessages: Record<number, string> = {
  1: "Unsure—flag this for a deeper review when you finish.",
  2: "Somewhat shaky—plan to revisit your notes soon.",
  3: "Balanced—use the reflection to reinforce what you know.",
  4: "Mostly confident—see if your reasoning matches the key points.",
  5: "Solid—challenge yourself to teach this concept after the quiz.",
};

const questionNarrative = (question: QuizQuestion) => {
  const difficulty = question.difficulty?.toLowerCase?.() ?? "";
  const difficultyCopy: Record<string, string> = {
    easy: "a quick recall warm-up",
    medium: "a core concept check",
    hard: "a stretch reflection",
  };
  const typeCopy =
    question.type === "MULTIPLE_CHOICE"
      ? "Choose the option that best matches the prompt—focus on spotting nuance between distractors."
      : "Write a short response that connects definitions to real examples you’ve seen in class.";

  return `${difficultyCopy[difficulty] ?? "an open-ended challenge"}. ${typeCopy}`;
};

const getConfidenceMessage = (value: number) => confidenceMessages[value] ?? confidenceMessages[3];

export function QuizRunner({ quiz, attemptPath }: QuizRunnerProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const totalQuestions = quiz.questions.length;
  const answeredCount = useMemo(
    () =>
      quiz.questions.reduce((count, question) => {
        const value = answers[question.id]?.userAnswer;
        if (typeof value === "string") {
          return value.trim() ? count + 1 : count;
        }
        if (Array.isArray(value)) {
          return value.length > 0 ? count + 1 : count;
        }
        if (value && typeof value === "object") {
          return Object.keys(value).length > 0 ? count + 1 : count;
        }
        return count;
      }, 0),
    [answers, quiz.questions]
  );

  const averageConfidence = useMemo(() => {
    const values = quiz.questions
      .map((question) => answers[question.id]?.confidence)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) {
      return null;
    }
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }, [answers, quiz.questions]);

  useEffect(() => {
    let isMounted = true;
    const startAttempt = async () => {
      try {
        const response = await fetch(attemptPath ?? `/api/quizzes/${quiz.id}/attempts`, {
          method: "POST",
        });
        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          if (isMounted) {
            setError(getErrorMessage(payload, "Unable to start quiz. Please refresh."));
          }
          return;
        }

        if (!isAttemptResponse(payload)) {
          if (isMounted) {
            setError("Quiz attempt could not be created. Please try again.");
          }
          return;
        }

        if (isMounted) {
          setAttemptId(payload.attemptId);
        }
      } catch (startError) {
        console.error("Failed to create quiz attempt", startError);
        if (isMounted) {
          setError("Unable to start quiz. Please refresh.");
        }
      }
    };

    void startAttempt();
    return () => {
      isMounted = false;
    };
  }, [quiz.id, attemptPath]);

  const handleMultipleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], userAnswer: value },
    }));
  };

  const handleShortAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], userAnswer: value },
    }));
  };

  const handleConfidence = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], confidence: value },
    }));
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    setError(null);
    startTransition(async () => {
      const responses = quiz.questions.map((question) => ({
        questionId: question.id,
        userAnswer: answers[question.id]?.userAnswer ?? "",
        confidence: answers[question.id]?.confidence,
      }));

      const response = await fetch(`/api/quizzes/${quiz.id}/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        setError(getErrorMessage(payload, "Submission failed."));
        return;
      }

      router.push(`/quizzes/${quiz.id}/attempts/${attemptId}`);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border-subtle/80 bg-bg-soft/70">
        <p className="text-xs uppercase tracking-[0.35em] text-text-muted">How this run works</p>
        <p className="mt-2 text-sm text-text-main">
          Answer thoughtfully, then use the confidence slider so reflections can compare how you felt with how you performed. The
          summary at the end calls out mismatches and recommendations.
        </p>
        <div className="mt-4 rounded-2xl border border-border-subtle/70 bg-bg-elevated/70 px-4 py-3 text-sm text-text-muted">
          {averageConfidence ? (
            <span>
              Avg confidence {averageConfidence.toFixed(1)}/5 — {getConfidenceMessage(Math.round(averageConfidence))}
            </span>
          ) : (
            <span>Slide the confidence marker on each question to unlock richer feedback.</span>
          )}
        </div>
      </Card>
      <Card className="border-dashed border-border-subtle/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Progress</p>
            <p className="text-lg font-semibold text-text-main">
              {answeredCount}/{totalQuestions} answered
            </p>
          </div>
          <p className="text-sm text-text-muted">
            Confidence slider keeps reflections gentle and personal.
          </p>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-bg-soft">
          <div
            className="h-full rounded-full bg-accent-strong transition-[width]"
            style={{ width: `${(answeredCount / Math.max(totalQuestions, 1)) * 100}%` }}
          />
        </div>
      </Card>
      {quiz.questions.map((question, index) => {
        const confidenceValue = answers[question.id]?.confidence ?? 3;
        return (
          <Card key={question.id} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Question {index + 1}</p>
                <p className="text-sm text-text-muted">
                  {question.type === "MULTIPLE_CHOICE" ? "Multiple choice" : "Short reflection"}
                </p>
              </div>
              <span className="rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-text-muted">
                {question.difficulty?.toLowerCase?.() ?? "mixed"}
              </span>
            </div>
            <p className="text-lg font-medium text-text-main">{question.prompt}</p>
            <p className="text-sm text-text-muted">{questionNarrative(question)}</p>
            {question.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                {question.choices?.map((choice) => (
                  <label
                    key={choice.value}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border bg-bg-soft/70 px-4 py-3 text-sm transition",
                      answers[question.id]?.userAnswer === choice.value
                        ? "border-accent text-text-main"
                        : "border-border-subtle/70 text-text-main hover:border-accent/60"
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.value}
                      checked={answers[question.id]?.userAnswer === choice.value}
                      onChange={(event) => handleMultipleChoice(question.id, event.target.value)}
                      className="h-4 w-4 accent-accent"
                    />
                    <div className="flex flex-col gap-0">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
                        {choice.label}
                      </span>
                      <span className="text-sm text-text-main">{choice.value}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {question.type === "SHORT_ANSWER" && (
              <TextArea
                rows={4}
                value={(answers[question.id]?.userAnswer as string) ?? ""}
                onChange={(event) => handleShortAnswer(question.id, event.target.value)}
                placeholder="Type your response"
                className="bg-bg-soft"
              />
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.4em] text-text-muted">Confidence</label>
              <input
                type="range"
                min={1}
                max={5}
                value={confidenceValue}
                onChange={(event) => handleConfidence(question.id, Number(event.target.value))}
                className="mt-3 w-full accent-accent"
              />
              <p className="text-xs text-text-muted">
                {confidenceValue} / 5 — {getConfidenceMessage(confidenceValue)}
              </p>
            </div>
          </Card>
        );
      })}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <PrimaryButton type="button" disabled={isSubmitting || !attemptId} onClick={handleSubmit}>
          {isSubmitting ? "Submitting…" : "Submit quiz"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => router.push("/dashboard")}>
          Save for later
        </SecondaryButton>
      </div>
    </div>
  );
}
