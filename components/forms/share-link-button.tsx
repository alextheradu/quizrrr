"use client";

import { useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface ShareLinkButtonProps {
  actionPath: string;
  label?: string;
  regenerateLabel?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const getShareUrl = (payload: unknown): string | null => {
  if (isRecord(payload) && typeof payload.shareUrl === "string" && payload.shareUrl.length > 0) {
    return payload.shareUrl;
  }
  return null;
};

export function ShareLinkButton({ actionPath, label = "Get share link", regenerateLabel = "Regenerate" }: ShareLinkButtonProps) {
  if (!collaborationEnabled) {
    return (
      <div className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
        Sharing links are temporarily unavailable.
      </div>
    );
  }
  const [isPending, startTransition] = useTransition();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestShareUrl = (regenerate = false) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(actionPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to generate share link."));
        return;
      }
      const nextUrl = getShareUrl(payload);
      if (!nextUrl) {
        setError("Share URL missing from response.");
        return;
      }
      setShareUrl(nextUrl);
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      setError("Copy failed. You can still highlight the link manually.");
    }
  };

  const handleCopyClick = () => {
    void handleCopy();
  };

  const handlePrimaryClick = () => {
    if (shareUrl) {
      void handleCopy();
      return;
    }
    requestShareUrl(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="button" disabled={isPending} onClick={handlePrimaryClick}>
          {isPending ? "Generating…" : shareUrl ? "Copy share link" : label}
        </PrimaryButton>
        {shareUrl && (
          <SecondaryButton type="button" disabled={isPending} onClick={() => requestShareUrl(true)}>
            {regenerateLabel}
          </SecondaryButton>
        )}
      </div>
      {shareUrl && (
        <div className="rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-2 text-sm text-text-main">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="break-all font-mono text-xs">{shareUrl}</span>
            <button type="button" className="text-sm font-semibold text-accent" onClick={handleCopyClick}>
              Copy
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
