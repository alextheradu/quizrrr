import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NoteForm } from "@/components/forms/note-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function NewNotePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Notes</p>
        <h1 className="text-3xl font-semibold text-text-main">Create new notes</h1>
        <p className="text-text-muted">Paste content or summaries to convert them into quiz-ready material.</p>
      </div>
      <Card>
        <CardTitle>Notes</CardTitle>
        <CardDescription className="mt-1">We will keep them private to your account.</CardDescription>
        <div className="mt-6">
          <NoteForm />
        </div>
      </Card>
    </div>
  );
}
