"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

interface GenerationLoadingModalProps {
  open: boolean;
  title?: string;
  message?: string;
  caution?: string;
}

export function GenerationLoadingModal({
  open,
  title = "Drafting with AI",
  message = "We’re generating your study materials based on the latest notes.",
  caution = "Please don’t refresh or close this tab—progress can’t be recovered mid-generation.",
}: GenerationLoadingModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0b0d] px-4 py-8">
      <div
        className="w-full max-w-md rounded-[32px] border border-border-subtle bg-bg-main p-6 text-center shadow-[0_45px_110px_rgba(0,0,0,0.55)] sm:p-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent/30 border-t-accent" aria-hidden />
        <p className="mt-6 text-lg font-semibold text-text-main">{title}</p>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-red-400">{caution}</p>
      </div>
    </div>,
    document.body
  );
}
