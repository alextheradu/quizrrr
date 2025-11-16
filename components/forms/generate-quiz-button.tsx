"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { PrimaryButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenerationLoadingModal } from "@/components/ui/loading-modal";
import { MAX_QUIZ_QUESTIONS } from "@/lib/constants";

interface GenerateQuizButtonProps {
  noteSetId: string;
  existingQuizId?: string;
}

interface GenerateQuizSuccess {
  quizId: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload)) {
    const possibleError = payload.error;
    if (typeof possibleError === "string" && possibleError.trim()) {
      return possibleError;
    }
  }
  return fallback;
};

const isGenerateQuizSuccess = (payload: unknown): payload is GenerateQuizSuccess =>
  isRecord(payload) && typeof payload.quizId === "string" && payload.quizId.length > 0;

const MIN_TOTAL_QUESTIONS = 4;
const PREF_KEY = "quizrrr:question-mix";
const PRESETS = [
  { label: "Balanced", multipleChoiceCount: 6, shortAnswerCount: 6 },
  { label: "MC drill", multipleChoiceCount: 10, shortAnswerCount: 4 },
  { label: "Open response", multipleChoiceCount: 4, shortAnswerCount: 8 },
];

const clampToRange = (value: number) => Math.max(0, Math.min(MAX_QUIZ_QUESTIONS, Math.round(value)));

const limitWithRemainder = (value: number, otherValue: number) => {
  const safeValue = clampToRange(value);
  const remaining = Math.max(0, MAX_QUIZ_QUESTIONS - clampToRange(otherValue));
  return Math.min(safeValue, remaining);
};

const normalizePair = (mc: number, sa: number) => {
  const safeMc = clampToRange(mc);
  const safeSa = Math.min(clampToRange(sa), MAX_QUIZ_QUESTIONS - safeMc);
  return { multipleChoiceCount: safeMc, shortAnswerCount: safeSa };
};

export function GenerateQuizButton({ noteSetId, existingQuizId }: GenerateQuizButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [multipleChoiceCount, setMultipleChoiceCount] = useState(8);
  const [shortAnswerCount, setShortAnswerCount] = useState(4);
  const [rememberSelection, setRememberSelection] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(PREF_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<{
          multipleChoiceCount: number;
          shortAnswerCount: number;
          remember: boolean;
        }>;

        if (typeof parsed.remember === "boolean") {
          setRememberSelection(parsed.remember);
        }

        if (typeof parsed.multipleChoiceCount === "number" && typeof parsed.shortAnswerCount === "number") {
          const normalized = normalizePair(parsed.multipleChoiceCount, parsed.shortAnswerCount);
          setMultipleChoiceCount(normalized.multipleChoiceCount);
          setShortAnswerCount(normalized.shortAnswerCount);
        }
      }
    } catch (storageError) {
      console.warn("Unable to restore quiz question mix", storageError);
    } finally {
      setPrefsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!prefsLoaded || typeof window === "undefined") {
      return;
    }

    if (!rememberSelection) {
      window.localStorage.removeItem(PREF_KEY);
      return;
    }

    window.localStorage.setItem(
      PREF_KEY,
      JSON.stringify({ multipleChoiceCount, shortAnswerCount, remember: true })
    );
  }, [multipleChoiceCount, shortAnswerCount, rememberSelection, prefsLoaded]);

  const totalQuestions = multipleChoiceCount + shortAnswerCount;
  const remaining = MAX_QUIZ_QUESTIONS - totalQuestions;
  const isOverLimit = totalQuestions > MAX_QUIZ_QUESTIONS;
  const isUnderMin = totalQuestions < MIN_TOTAL_QUESTIONS;
  const totalStatus = isOverLimit
    ? `You've exceeded the ${MAX_QUIZ_QUESTIONS}-question limit.`
    : isUnderMin
      ? `Add at least ${MIN_TOTAL_QUESTIONS - totalQuestions} more question${
          MIN_TOTAL_QUESTIONS - totalQuestions === 1 ? "" : "s"
        }.`
      : remaining === 0
        ? "You're at the 14-question cap—perfect for a full review."
        : `${remaining} question${remaining === 1 ? "" : "s"} left before you hit the limit.`;

  const statusTone = clsx(
    "text-xs font-semibold uppercase tracking-[0.3em]",
    isOverLimit ? "text-red-500" : isUnderMin ? "text-amber-500" : "text-text-muted"
  );

  const isGenerateDisabled =
    isPending || isOverLimit || isUnderMin || (multipleChoiceCount === 0 && shortAnswerCount === 0);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setMultipleChoiceCount(preset.multipleChoiceCount);
    setShortAnswerCount(preset.shortAnswerCount);
  };

  const updateMultipleChoice = (nextValue: number) => {
    setMultipleChoiceCount((current) => {
      if (nextValue === current) return current;
      const adjusted = limitWithRemainder(nextValue, shortAnswerCount);
      return adjusted;
    });
  };

  const updateShortAnswer = (nextValue: number) => {
    setShortAnswerCount((current) => {
      if (nextValue === current) return current;
      const adjusted = limitWithRemainder(nextValue, multipleChoiceCount);
      return adjusted;
    });
  };

  const stepMultipleChoice = (delta: number) => {
    updateMultipleChoice(multipleChoiceCount + delta);
  };

  const stepShortAnswer = (delta: number) => {
    updateShortAnswer(shortAnswerCount + delta);
  };

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteSetId,
          multipleChoiceCount,
          shortAnswerCount,
        }),
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to generate quiz."));
        return;
      }

      if (!isGenerateQuizSuccess(payload)) {
        setError("Quiz details missing from response.");
        return;
      }

      router.push(`/quizzes/${payload.quizId}/take`);
    });
  };

  const renderCounter = (
    label: string,
    value: number,
    onIncrement: () => void,
    onDecrement: () => void,
    onManualChange: (next: number) => void,
    helper: string
  ) => (
    <div className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 p-4 shadow-inner shadow-black/5">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-text-muted">
        <span>{label}</span>
        <span className="text-base tracking-normal text-text-main">{value}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle/70 bg-bg-main text-lg text-text-main transition hover:border-accent"
          disabled={value === 0 || isPending}
          aria-label={`Decrease ${label.toLowerCase()} count`}
        >
          −
        </button>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_QUIZ_QUESTIONS}
          value={value}
          onChange={(event) => onManualChange(Number(event.target.value))}
          className="w-full text-center text-lg font-semibold"
          aria-label={`${label} count`}
        />
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle/70 bg-bg-main text-lg text-text-main transition hover:border-accent"
          disabled={isPending || remaining <= 0}
          aria-label={`Increase ${label.toLowerCase()} count`}
        >
          +
        </button>
      </div>
      <p className="mt-2 text-xs text-text-muted">{helper}</p>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Question mix</p>
              <p className="text-base text-text-main">Tailor how many prompts are multiple choice vs. open ended.</p>
            </div>
            <p className="text-sm font-semibold text-text-main">
              {multipleChoiceCount} MC + {shortAnswerCount} Open = {totalQuestions}
            </p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-bg-soft">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                isOverLimit ? "bg-red-400" : isUnderMin ? "bg-amber-400" : "bg-accent-strong"
              )}
              style={{ width: `${Math.min(100, (totalQuestions / MAX_QUIZ_QUESTIONS) * 100)}%` }}
            />
          </div>
          <p className={`${statusTone} mt-2`}>{totalStatus}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {renderCounter(
            "Multiple choice",
            multipleChoiceCount,
            () => stepMultipleChoice(1),
            () => stepMultipleChoice(-1),
            (next) => updateMultipleChoice(Number.isNaN(next) ? 0 : next),
            "Each question includes four labeled options."
          )}
          {renderCounter(
            "Short answer",
            shortAnswerCount,
            () => stepShortAnswer(1),
            () => stepShortAnswer(-1),
            (next) => updateShortAnswer(Number.isNaN(next) ? 0 : next),
            "Open ended prompts that expect free-form responses."
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-muted">Quick presets</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const isActive =
                preset.multipleChoiceCount === multipleChoiceCount && preset.shortAnswerCount === shortAnswerCount;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-subtle/70 text-text-muted hover:border-accent hover:text-text-main"
                  )}
                >
                  {preset.label} ({preset.multipleChoiceCount}/{preset.shortAnswerCount})
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border-subtle/70 text-accent focus:ring-accent"
            checked={rememberSelection}
            onChange={(event) => setRememberSelection(event.target.checked)}
          />
          Remember this mix on this device
        </label>

        {existingQuizId && (
          <p className="text-xs text-text-muted">
            Regenerating replaces your previous quiz for this note set, but attempts remain intact.
          </p>
        )}

        <PrimaryButton type="button" onClick={handleGenerate} disabled={isGenerateDisabled}>
          {isPending ? "Generating…" : existingQuizId ? "Regenerate quiz" : "Generate quiz"}
        </PrimaryButton>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <GenerationLoadingModal
        open={isPending}
        title="Drafting your quiz"
        message="Quizzr is turning your notes into bite-sized questions."
        caution="Don’t refresh or leave—this request can’t be recovered if interrupted."
      />
    </>
  );
}
