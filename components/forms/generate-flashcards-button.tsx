"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/button";
import { GenerationLoadingModal } from "@/components/ui/loading-modal";

interface FlashcardSetResponse {
  flashcardSet: { id: string };
}

interface GenerateFlashcardsButtonProps {
  noteSetId: string;
  defaultTitle?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const isFlashcardSetResponse = (payload: unknown): payload is FlashcardSetResponse =>
  isRecord(payload) && typeof (payload as { flashcardSet?: { id?: unknown } }).flashcardSet?.id === "string";

export function GenerateFlashcardsButton({ noteSetId, defaultTitle }: GenerateFlashcardsButtonProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [cardCount, setCardCount] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteSetId, title, cardCount }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to generate flashcards."));
        return;
      }
      if (!isFlashcardSetResponse(payload)) {
        setError("Flashcard set missing from response.");
        return;
      }
      router.push(`/flashcards/${payload.flashcardSet.id}`);
    });
  };

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-border-subtle/70 bg-bg-soft/70 p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.4em] text-text-muted" htmlFor="flashcard-title">
          Flashcard title
        </label>
        <Input
          id="flashcard-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Photosynthesis essentials"
        />
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
            <label htmlFor="card-count">Cards</label>
            <span className="tracking-normal text-text-main">{cardCount}</span>
          </div>
          <input
            id="card-count"
            type="range"
            min={6}
            max={24}
            step={1}
            value={cardCount}
            onChange={(event) => setCardCount(Number(event.target.value))}
            className="mt-3 w-full accent-accent"
          />
        </div>
        <PrimaryButton type="button" onClick={handleGenerate} disabled={isPending}>
          {isPending ? "Generating…" : "Generate flashcards"}
        </PrimaryButton>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <GenerationLoadingModal
        open={isPending}
        title="Drafting flashcards"
        message="We’re weaving your notes into question-answer pairs."
        caution="Don’t refresh or leave—the set will be lost if the request stops."
      />
    </>
  );
}
