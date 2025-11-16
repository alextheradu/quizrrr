"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { clsx } from "clsx";

interface FlashcardEditorProps {
  flashcardSetId: string;
  initialTitle: string;
  initialCards: Array<{ id?: string; front: string; back: string }>;
}

interface EditableCard extends Omit<FlashcardEditorProps["initialCards"][number], "id"> {
  id?: string;
  tempId: string;
}

const createTempId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const normalizeCards = (cards: FlashcardEditorProps["initialCards"]) =>
  cards.length > 0
    ? cards.map((card) => ({ ...card, tempId: createTempId() }))
    : [{ tempId: createTempId(), front: "", back: "" }];

const hasEmptyField = (card: EditableCard) => !card.front.trim() || !card.back.trim();

const serializeCards = (cards: EditableCard[]) =>
  cards.map((card) => {
    const { tempId, ...rest } = card;
    void tempId;
    return rest;
  });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const extractError = (payload: unknown, fallback: string) => {
  if (isRecord(payload)) {
    const message = payload.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
};

export function FlashcardEditor({ flashcardSetId, initialCards, initialTitle }: FlashcardEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [cards, setCards] = useState<EditableCard[]>(() => normalizeCards(initialCards));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = useMemo(() => {
    if (title.trim() !== initialTitle.trim()) {
      return true;
    }
    if (cards.length !== initialCards.length) {
      return true;
    }
    return cards.some((card, index) => {
      const source = initialCards[index];
      if (!source) {
        return true;
      }
      return card.front.trim() !== source.front.trim() || card.back.trim() !== source.back.trim();
    });
  }, [cards, initialCards, initialTitle, title]);

  const updateCardField = (tempId: string, field: "front" | "back", value: string) => {
    setCards((prev) => prev.map((card) => (card.tempId === tempId ? { ...card, [field]: value } : card)));
  };

  const addCard = () => {
    setCards((prev) => [...prev, { tempId: createTempId(), front: "", back: "" }]);
  };

  const removeCard = (tempId: string) => {
    setCards((prev) => (prev.length === 1 ? prev : prev.filter((card) => card.tempId !== tempId)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/flashcards/${flashcardSetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, flashcards: serializeCards(cards) }),
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(extractError(payload, "Unable to update flashcards."));
        return;
      }

      setSuccessMessage("Flashcards updated.");
      router.refresh();
    });
  };

  const isSubmitDisabled =
    isPending || !title.trim() || cards.some(hasEmptyField) || (successMessage === null && dirty === false);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium text-text-main" htmlFor="flashcardTitle">
          Title
        </label>
        <Input
          id="flashcardTitle"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2"
          placeholder="Biology chapter flashcards"
          required
        />
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={card.tempId} className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 p-4 shadow-inner shadow-black/5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-muted">
              <span>Card {index + 1}</span>
              <button
                type="button"
                onClick={() => removeCard(card.tempId)}
                className={clsx(
                  "text-[11px] font-semibold uppercase tracking-[0.3em] text-text-muted transition hover:text-text-main",
                  cards.length === 1 && "opacity-40"
                )}
                disabled={cards.length === 1}
              >
                Remove
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted" htmlFor={`front-${card.tempId}`}>
                  Prompt
                </label>
                <TextArea
                  id={`front-${card.tempId}`}
                  value={card.front}
                  onChange={(event) => updateCardField(card.tempId, "front", event.target.value)}
                  className="mt-2"
                  rows={3}
                  placeholder="What is the powerhouse of the cell?"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted" htmlFor={`back-${card.tempId}`}>
                  Answer
                </label>
                <TextArea
                  id={`back-${card.tempId}`}
                  value={card.back}
                  onChange={(event) => updateCardField(card.tempId, "back", event.target.value)}
                  className="mt-2"
                  rows={3}
                  placeholder="The mitochondria."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <SecondaryButton type="button" onClick={addCard} className="text-sm">
          Add card
        </SecondaryButton>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

      <PrimaryButton type="submit" disabled={isSubmitDisabled}>
        {isPending ? "Saving…" : "Save changes"}
      </PrimaryButton>
    </form>
  );
}
