"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DangerButton } from "@/components/ui/button";

interface FlashcardDeleteButtonProps {
  flashcardSetId: string;
  redirectTo?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

export function FlashcardDeleteButton({ flashcardSetId, redirectTo }: FlashcardDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handleDelete = () => {
    if (!confirm("Delete this flashcard set?")) return;
    startTransition(async () => {
      const response = await fetch(`/api/flashcards/${flashcardSetId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        alert(getErrorMessage(payload, "Unable to delete flashcards."));
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <DangerButton type="button" onClick={handleDelete} disabled={isPending} className="text-xs uppercase tracking-[0.3em]">
      {isPending ? "Removing…" : "Delete flashcards"}
    </DangerButton>
  );
}
