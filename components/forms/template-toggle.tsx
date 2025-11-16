"use client";

import { useState, useTransition } from "react";
import { PrimaryButton } from "@/components/ui/button";
import { TextArea } from "@/components/ui/textarea";

interface TemplateToggleProps {
  quizId: string;
  initialEnabled: boolean;
  initialDescription?: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
};

const isTemplateResponse = (payload: unknown): payload is { template: { isPublicTemplate: boolean; templateDescription: string | null } } =>
  isRecord(payload) && typeof (payload as { template?: { isPublicTemplate?: unknown } }).template?.isPublicTemplate === "boolean";

export function TemplateToggle({ quizId, initialEnabled, initialDescription }: TemplateToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quizId}/template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublicTemplate: enabled, description }),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to update template status."));
        return;
      }
      if (!isTemplateResponse(payload)) {
        setError("Template details missing from response.");
        return;
      }
      setEnabled(payload.template.isPublicTemplate);
      setDescription(payload.template.templateDescription ?? "");
      setStatus(payload.template.isPublicTemplate ? "Template published" : "Template hidden");
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border-subtle/70 bg-bg-soft/70 p-4">
      <label className="flex items-center gap-3 text-sm font-semibold text-text-main">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        Publish to community gallery
      </label>
      <TextArea
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Describe who this quiz helps and what's inside."
        disabled={!enabled}
      />
      <PrimaryButton type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving…" : "Save template settings"}
      </PrimaryButton>
      {status && <p className="text-sm text-green-600">{status}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
