"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, GhostButton } from "@/components/ui/button";
import type { ButtonVariant } from "@/components/ui/button-classes";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

interface ActionModalProps {
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  title: string;
  description?: string;
  children: ReactNode;
}

export function ActionModal({ triggerLabel, triggerVariant = "primary", title, description, children }: ActionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = description ? `${titleId}-description` : undefined;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    lockBodyScroll();

    return () => {
      document.removeEventListener("keydown", handleKey);
      unlockBodyScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const handleInnerClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const modalMarkup = !isOpen ? null : (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className="absolute inset-0 bg-[#0b0b0d]" onClick={closeModal} />
      <div className="relative flex h-full items-center justify-center px-4 py-10" onClick={closeModal}>
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-2xl rounded-[32px] border border-border-subtle bg-bg-main p-6 shadow-[0_35px_95px_rgba(0,0,0,0.55)] sm:p-8"
          onClick={handleInnerClick}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Focused action</p>
              <h2 id={titleId} className="mt-2 text-2xl font-semibold text-text-main">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-2 text-sm text-text-muted">
                  {description}
                </p>
              )}
            </div>
            <GhostButton type="button" aria-label="Close modal" onClick={closeModal}>
              Close
            </GhostButton>
          </div>
          <div className="mt-8 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button type="button" variant={triggerVariant} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </Button>
      {isMounted ? createPortal(modalMarkup, document.body) : null}
    </>
  );
}
