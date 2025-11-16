"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface Collaborator {
  id: string;
  collaboratorEmail: string;
  createdAt: string;
}

interface NoteCollaboratorsManagerProps {
  noteId: string;
  collaborators: Collaborator[];
  canManage: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getError = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const isCollaboratorPayload = (payload: unknown): payload is { collaborators: Collaborator[] } =>
  isRecord(payload) && Array.isArray((payload as { collaborators?: unknown }).collaborators);

export function NoteCollaboratorsManager({ noteId, collaborators, canManage }: NoteCollaboratorsManagerProps) {
  if (!collaborationEnabled) {
    return (
      <p className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 p-4 text-sm text-text-muted">
        Collaboration controls are temporarily disabled.
      </p>
    );
  }
  const [items, setItems] = useState<Collaborator[]>(collaborators);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/notes/${noteId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getError(payload, "Unable to add collaborator."));
        return;
      }
      if (!isCollaboratorPayload(payload)) {
        setError("Collaborator list missing from response.");
        return;
      }
      setItems(payload.collaborators);
      setEmail("");
    });
  };

  const handleRemove = (collaboratorId: string) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/notes/${noteId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getError(payload, "Unable to remove collaborator."));
        return;
      }
      if (!isCollaboratorPayload(payload)) {
        setError("Collaborator list missing from response.");
        return;
      }
      setItems(payload.collaborators);
    });
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="space-y-3 rounded-2xl border border-border-subtle/70 bg-bg-soft/70 p-4">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted" htmlFor="collaborator-email">
            Invite collaborator
          </label>
          <Input
            id="collaborator-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@school.edu"
          />
          <PrimaryButton type="button" onClick={handleAdd} disabled={isPending || !email.trim()}>
            {isPending ? "Sending…" : "Share access"}
          </PrimaryButton>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Collaborators</p>
        <ul className="space-y-2">
          {items.length === 0 && <li className="text-sm text-text-muted">No collaborators yet.</li>}
          {items.map((collaborator) => (
            <li
              key={collaborator.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-2 text-sm text-text-main"
            >
              <span className="font-mono text-xs">{collaborator.collaboratorEmail}</span>
              {canManage && (
                <SecondaryButton
                  type="button"
                  className="px-3 py-1 text-xs uppercase tracking-[0.3em]"
                  onClick={() => handleRemove(collaborator.id)}
                  disabled={isPending}
                >
                  Remove
                </SecondaryButton>
              )}
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
