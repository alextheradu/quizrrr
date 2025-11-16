"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";

interface FlashcardViewerProps {
  flashcards: Array<{ id: string; front: string; back: string }>;
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const ordered = useMemo(() => flashcards ?? [], [flashcards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = ordered[index];
  const progress = ordered.length > 0 ? ((index + 1) / ordered.length) * 100 : 0;

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, ordered.length - 1));
    setFlipped(false);
  };

  const goPrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
    setFlipped(false);
  };

  if (!current) {
    return <p className="text-sm text-text-muted">No flashcards yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-muted">
          <span>
            Card {index + 1}/{ordered.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-bg-soft">
          <div className="h-full rounded-full bg-accent-strong" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Card
        className="min-h-[240px] cursor-pointer overflow-hidden border-dashed border-border-subtle/70 p-0 [perspective:1200px]"
        onClick={() => setFlipped((prev) => !prev)}
      >
        <div
          className={clsx(
            "relative h-full min-h-[240px] w-full transition-transform duration-500 [transform-style:preserve-3d]",
            flipped ? "[transform:rotateY(180deg)]" : ""
          )}
        >
          <div className="absolute inset-0 flex h-full flex-col justify-center gap-3 px-6 py-8 text-center [backface-visibility:hidden]">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Prompt</p>
            <p className="text-xl font-semibold text-text-main">{current.front}</p>
          </div>
          <div className="absolute inset-0 flex h-full flex-col justify-center gap-3 px-6 py-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Answer</p>
            <p className="text-xl font-semibold text-text-main">{current.back}</p>
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="button" onClick={() => setFlipped((prev) => !prev)}>
          {flipped ? "Hide answer" : "Reveal answer"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={goPrev} disabled={index === 0}>
          Previous
        </SecondaryButton>
        <SecondaryButton type="button" onClick={goNext} disabled={index === ordered.length - 1}>
          Next
        </SecondaryButton>
      </div>
    </div>
  );
}
