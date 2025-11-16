"use client";

import { useState, useTransition } from "react";
import { SecondaryButton } from "@/components/ui/button";

interface QuestionExplanationButtonProps {
  quizId: string;
  attemptId: string;
  responseId: string;
  initialFeedback?: string | null;
}

export function QuestionExplanationButton({ quizId, attemptId, responseId, initialFeedback }: QuestionExplanationButtonProps) {
  const [explanation, setExplanation] = useState(initialFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/quizzes/${quizId}/attempts/${attemptId}/responses/${responseId}/explain`,
          { method: "POST" }
        );
        const payload = (await response.json()) as { feedback?: string; error?: string };
        if (!response.ok || !payload.feedback) {
          setError(payload.error ?? "Unable to generate explanation.");
          return;
        }
        setExplanation(payload.feedback);
      } catch (apiError) {
        console.error(apiError);
        setError("Network error. Please try again.");
      }
    });
  };

  if (explanation) {
    return (
      <div className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/70 px-4 py-3 text-sm text-text-main">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-muted">Detailed AI explanation</p>
        <p className="mt-2 whitespace-pre-wrap">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SecondaryButton type="button" onClick={handleGenerate} disabled={isPending}>
        {isPending ? "Generating explanation…" : "Generate detailed explanation"}
      </SecondaryButton>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
