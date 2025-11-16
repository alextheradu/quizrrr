"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton } from "@/components/ui/button";

interface NoteDeleteButtonProps {
  noteId: string;
  redirectTo?: string;
  label?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

export function NoteDeleteButton({ noteId, redirectTo = "/notes", label = "Delete notes" }: NoteDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (isPending) return;
    const confirmed = window.confirm("This note set and its quizzes will be removed. Continue?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        setError(getErrorMessage(payload, "Unable to delete notes."));
        return;
      }
      router.push(redirectTo);
      router.refresh();
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
