"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import { HOME_ROUTE } from "@/lib/constants";

const STORAGE_KEY = "quizrrr:tutorial_seen";
const ELIGIBLE_TUTORIAL_PATHS = new Set([HOME_ROUTE, "/dashboard"]);

const steps = [
  {
    title: "Import or draft notes",
    detail: "Use Notes → New to paste class notes or upload a doc—Quizzr turns them into study-ready blocks.",
  },
  {
    title: "Generate quizzes & flashcards",
    detail: "From any note, spin up flashcards or quizzes with one click and tweak the prompts before saving.",
  },
  {
    title: "Run a session",
    detail: "Head to Dashboard or Quizzes to take a run, track confidence, and review instant feedback.",
  },
  {
    title: "Review & reflect",
    detail: "Run quizzes, log confidence, and let the dashboard call out what to revisit next.",
  },
];

interface TutorialGuideProps {
  isSignedIn: boolean;
}

export function TutorialGuide({ isSignedIn }: TutorialGuideProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const pathname = usePathname();
  const canShowTutorial = isSignedIn && Boolean(pathname && ELIGIBLE_TUTORIAL_PATHS.has(pathname));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !canShowTutorial || typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === "seen";
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [canShowTutorial, isMounted]);

  useEffect(() => {
    if (!isOpen) return undefined;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  const markSeen = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "seen");
    }
  };

  const closeModal = (persistSeen: boolean) => {
    if (persistSeen) {
      markSeen();
    }
    setIsOpen(false);
  };

  const modalMarkup = !isOpen
    ? null
    : (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
          <div className="absolute inset-0 bg-[#010103]/100 backdrop-blur-sm" onClick={() => closeModal(false)} />
          <div className="relative flex h-full items-center justify-center px-4 py-8" onClick={() => closeModal(false)}>
            <div
              className="w-full max-w-3xl rounded-[32px] border border-border-subtle/90 bg-bg-main/100 p-6 shadow-[0_45px_160px_rgba(4,4,7,0.95)] sm:p-10"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Quick tour</p>
              <h2 id={titleId} className="mt-2 text-3xl font-semibold text-text-main">
                Welcome to Quizzr
              </h2>
              <p id={descriptionId} className="mt-3 text-sm text-text-muted">
                Here’s a 30-second primer so you always know the next best click.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <li key={step.title} className="rounded-3xl border border-border-subtle/70 bg-bg-soft/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-text-muted">Step {index + 1}</p>
                    <p className="mt-2 text-lg font-semibold text-text-main">{step.title}</p>
                    <p className="mt-1 text-sm text-text-muted">{step.detail}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton type="button" onClick={() => closeModal(true)}>
                  Start exploring
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => closeModal(false)}>
                  Remind me later
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      );

  if (!isMounted || !canShowTutorial) {
    return null;
  }

  return (
    <>
      {createPortal(modalMarkup, document.body)}
      <button
        type="button"
        className="fixed bottom-4 right-4 z-20 rounded-full border border-border-subtle/70 bg-bg-elevated/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-text-muted shadow-lg shadow-black/20 transition hover:text-text-main"
        onClick={() => setIsOpen(true)}
      >
        Need a tour?
      </button>
    </>
  );
}
