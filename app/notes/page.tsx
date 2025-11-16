import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ShareLinkButton } from "@/components/forms/share-link-button";
import { NoteDeleteButton } from "@/components/forms/note-delete-button";
import { LinkButton } from "@/components/ui/link-button";
import { noteAccessFilter } from "@/lib/access";
import { collaborationEnabled } from "@/lib/feature-flags";

export default async function NotesIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  const noteSets = await prisma.noteSet.findMany({
    where: noteAccessFilter(userId, userEmail),
    orderBy: { updatedAt: "desc" },
    include: { quizzes: true, collaborators: true, user: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Notes</p>
          <h1 className="text-3xl font-semibold text-text-main">Your study libraries</h1>
          <p className="text-text-muted">
            {collaborationEnabled ? "Review, share, or clean up note sets with a couple clicks." : "Review your note sets and keep everything tidy."}
          </p>
        </div>
        <LinkButton href="/notes/new">New note set</LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {noteSets.map((note) => (
          <Card key={note.id} className="space-y-4">
            <div>
              <CardTitle>{note.title}</CardTitle>
              <CardDescription className="mt-1 space-y-1">
                <p>
                  Updated {new Date(note.updatedAt).toLocaleDateString()} · {note.quizzes.length} quizzes
                </p>
                {collaborationEnabled && note.userId !== userId && (
                  <span className="text-xs uppercase tracking-[0.3em] text-accent">Shared by {note.user?.name ?? note.user?.email}</span>
                )}
                {collaborationEnabled && note.collaborators.length > 0 && (
                  <span className="text-xs text-text-muted">{note.collaborators.length} collaborators</span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <LinkButton
                href={`/notes/${note.id}`}
                className="px-3 py-1.5 text-xs font-semibold md:text-sm"
              >
                View
              </LinkButton>
              <LinkButton
                href={`/notes/${note.id}#quizzes`}
                variant="ghost"
                className="px-3 py-1.5 text-xs md:text-sm"
              >
                Linked quizzes
              </LinkButton>
            </div>
            {collaborationEnabled ? (
              <ShareLinkButton actionPath={`/api/notes/${note.id}/share`} label="Share" regenerateLabel="Refresh link" />
            ) : (
              <p className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
                Sharing is temporarily disabled.
              </p>
            )}
            <NoteDeleteButton noteId={note.id} />
          </Card>
        ))}
        {noteSets.length === 0 && (
          <Card>
            <CardTitle>No notes yet</CardTitle>
            <CardDescription className="mt-1">Start a fresh set to generate custom quizzes.</CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
