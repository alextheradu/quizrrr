"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton } from "@/components/ui/button";

interface QuizDeleteButtonProps {
  quizId: string;
  redirectTo?: string;
  label?: string;
  onDeleted?: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

export function QuizDeleteButton({ quizId, redirectTo, label = "Delete quiz", onDeleted }: QuizDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (isPending) return;
    const confirmed = window.confirm("This will permanently remove the quiz, its questions, and attempts. Continue?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        setError(getErrorMessage(payload, "Unable to delete quiz."));
        return;
      }

      if (onDeleted) {
        onDeleted();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-1">
      <DangerButton type="button" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Removing…" : label}
      </DangerButton>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
