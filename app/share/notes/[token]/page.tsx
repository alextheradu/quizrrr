import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface SharedNotePageProps {
  params: { token: string };
}

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  if (!collaborationEnabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Sharing paused</p>
        <h1 className="text-3xl font-semibold text-text-main">Collaboration temporarily disabled</h1>
        <p className="text-sm text-text-muted">
          Shared note links are turned off right now. Ask the owner to send files directly in the meantime.
        </p>
        <LinkButton href="/" className="px-4 py-2 text-sm">
          Go home
        </LinkButton>
      </div>
    );
  }
  const note = await prisma.noteSet.findFirst({
    where: { shareToken: params.token },
    include: { user: { select: { name: true } }, quizzes: true },
  });

  if (!note) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Shared note set</p>
        <h1 className="text-3xl font-semibold text-text-main">{note.title}</h1>
        <p className="text-sm text-text-muted">
          Contributed by {note.user?.name ?? "a Quizzr student"} · {new Date(note.updatedAt).toLocaleDateString()}
        </p>
        <LinkButton href="/" className="px-3 py-1.5 text-xs md:text-sm">
          Create your own study notes
        </LinkButton>
      </div>

      <Card>
        <CardTitle>Raw notes</CardTitle>
        <CardDescription className="mt-1">Scroll to review or copy into your workspace.</CardDescription>
        <div className="mt-4 max-h-[480px] overflow-y-auto rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-4 text-sm leading-relaxed text-text-main">
          <pre className="whitespace-pre-wrap font-sans text-base text-text-main">{note.rawContent}</pre>
        </div>
      </Card>

      {note.quizzes.length > 0 && (
        <Card>
          <CardTitle>Connected quizzes</CardTitle>
          <CardDescription className="mt-1">Ask the creator for access to take their quiz.</CardDescription>
          <div className="mt-4 space-y-2 text-sm text-text-main">
            {note.quizzes.map((quiz) => (
              <p key={quiz.id}>
                {quiz.title} · {new Date(quiz.updatedAt).toLocaleDateString()}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
