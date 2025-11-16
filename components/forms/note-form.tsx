"use client";

import { FormEvent, useState, useTransition, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const SOURCE_TYPES = [
  { label: "Paste notes", value: "PASTE" },
  { label: "Upload document", value: "DOC_UPLOAD" },
];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (isRecord(payload)) {
    const maybeError = payload.error;
    if (typeof maybeError === "string" && maybeError.trim()) {
      return maybeError;
    }
  }
  return fallback;
};

const isNoteSuccess = (payload: unknown): payload is { noteSet: { id: string } } =>
  isRecord(payload) && isRecord(payload.noteSet) && typeof payload.noteSet.id === "string" && payload.noteSet.id.length > 0;

export function NoteForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState("PASTE");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPasteSource = sourceType === "PASTE";
  const isDocumentSource = sourceType === "DOC_UPLOAD";

  const isSubmitDisabled =
    isPending ||
    !title.trim() ||
    (isPasteSource && !rawContent.trim()) ||
    (isDocumentSource && !uploadFile);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setUploadFile(file);
  };

  const resetFile = () => setUploadFile(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      let response: Response;

      if (isPasteSource) {
        response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, rawContent, sourceType }),
        });
      } else {
        const formData = new FormData();
        formData.append("title", title);
        if (uploadFile) {
          formData.append("file", uploadFile);
        }
        response = await fetch("/api/notes/import/document", {
          method: "POST",
          body: formData,
        });
      }

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to save notes right now."));
        return;
      }

      if (!isNoteSuccess(payload)) {
        setError("Note set missing from response. Please try again.");
        return;
      }

      router.push(`/notes/${payload.noteSet.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium text-text-main" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Chemistry midterm notes"
          className="mt-2"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-text-main" htmlFor="sourceType">
          Content source
        </label>
        <select
          id="sourceType"
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-border-subtle/70 bg-bg-soft/70 px-4 py-3 text-base text-text-main shadow-inner shadow-black/5 focus:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
        >
          {SOURCE_TYPES.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-text-muted">Choose how you want to bring notes into Quizrrr.</p>
      </div>

      {isPasteSource && (
        <div>
          <label className="text-sm font-medium text-text-main" htmlFor="rawContent">
            Notes
          </label>
          <TextArea
            id="rawContent"
            value={rawContent}
            onChange={(event) => setRawContent(event.target.value)}
            placeholder="Paste messy lecture notes, Quizlet exports, or summaries."
            rows={12}
            required={isPasteSource}
            className="mt-2"
          />
          <div className="mt-3 rounded-2xl border border-border-subtle/60 bg-bg-soft/70 p-4 text-sm text-text-muted">
            <p className="font-semibold text-text-main">Importing from Quizlet</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open the Quizlet set, click <span className="font-medium text-text-main">Export</span>, and choose text mode.</li>
              <li>Copy the generated terms/definitions text to your clipboard.</li>
              <li>Paste it into the box above—each term/definition pair becomes editable notes.</li>
            </ol>
          </div>
        </div>
      )}

      {isDocumentSource && (
        <div>
          <label className="text-sm font-medium text-text-main" htmlFor="noteUpload">
            Upload document
          </label>
          <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-dashed border-border-subtle/70 bg-bg-soft/60 p-4 text-sm">
            <input
              id="noteUpload"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="text-sm text-text-main"
              required={isDocumentSource}
            />
            {uploadFile && (
              <div className="flex items-center justify-between rounded-xl border border-border-subtle/60 bg-bg-main/80 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text-main">{uploadFile.name}</p>
                  <p className="text-xs text-text-muted">{Math.round(uploadFile.size / 1024)} KB</p>
                </div>
                <SecondaryButton type="button" onClick={resetFile} className="px-3 py-1 text-xs">
                  Remove
                </SecondaryButton>
              </div>
            )}
            <p className="text-xs text-text-muted">
              Supported types: PDF, DOCX, TXT, or Markdown (max 6 MB). We convert the file contents into a single note set you can edit.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <PrimaryButton type="submit" disabled={isSubmitDisabled}>
        {isPending ? "Saving…" : "Save notes"}
      </PrimaryButton>
    </form>
  );
}
