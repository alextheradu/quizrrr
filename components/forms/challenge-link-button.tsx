"use client";

import { useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface ChallengeLinkButtonProps {
  quizId: string;
  initialUrl?: string | null;
  initialExpiresAt?: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const isChallengeResponse = (payload: unknown): payload is { shareUrl: string; expiresAt: string | null } =>
  isRecord(payload) && typeof (payload as { shareUrl?: unknown }).shareUrl === "string";

export function ChallengeLinkButton({ quizId, initialUrl, initialExpiresAt }: ChallengeLinkButtonProps) {
  if (!collaborationEnabled) {
    return (
      <div className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 p-4 text-sm text-text-muted">
        Classroom challenges are temporarily unavailable.
      </div>
    );
  }
  const [duration, setDuration] = useState(30);
  const [shareUrl, setShareUrl] = useState<string | null>(initialUrl ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const createChallenge = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quizId}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInMinutes: duration }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to start challenge."));
        return;
      }
      if (!isChallengeResponse(payload)) {
        setError("Challenge details missing from response.");
        return;
      }
      setShareUrl(payload.shareUrl);
      setExpiresAt(payload.expiresAt ?? null);
    });
  };

  const endChallenge = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quizId}/challenge`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        setError(getErrorMessage(payload, "Unable to end challenge."));
        return;
      }
      setShareUrl(null);
      setExpiresAt(null);
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

  return (
    <div className="space-y-3 rounded-2xl border border-border-subtle/70 bg-bg-soft/60 p-4">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
        <span>Challenge length</span>
        <span className="tracking-normal text-text-main">{duration} min</span>
      </div>
      <input
        type="range"
        min={5}
        max={120}
        step={5}
        value={duration}
        onChange={(event) => setDuration(Number(event.target.value))}
        className="w-full accent-accent"
      />
      <PrimaryButton type="button" onClick={createChallenge} disabled={isPending}>
        {isPending ? "Starting…" : shareUrl ? "Refresh challenge" : "Start classroom challenge"}
      </PrimaryButton>
      {shareUrl && (
        <div className="space-y-2">
          <div className="rounded-2xl border border-border-subtle/70 bg-white/40 p-3 text-xs text-text-main">
            <p className="break-all font-mono">{shareUrl}</p>
            <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-text-muted">
              {expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}` : "No expiration"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton
              type="button"
              onClick={() => {
                void handleCopy();
              }}
              disabled={isPending}
            >
              Copy link
            </SecondaryButton>
            <SecondaryButton type="button" onClick={endChallenge} disabled={isPending}>
              End challenge
            </SecondaryButton>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
