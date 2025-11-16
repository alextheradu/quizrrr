import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { GenerateQuizButton } from "@/components/forms/generate-quiz-button";
import { ShareLinkButton } from "@/components/forms/share-link-button";
import { NoteDeleteButton } from "@/components/forms/note-delete-button";
import { LinkButton } from "@/components/ui/link-button";
import { noteAccessById } from "@/lib/access";
import { NoteCollaboratorsManager } from "@/components/forms/note-collaborators";
import { GenerateFlashcardsButton } from "@/components/forms/generate-flashcards-button";
import { ActionModal } from "@/components/ui/action-modal";
import { collaborationEnabled } from "@/lib/feature-flags";

const dateTimeFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

interface NotePageProps {
  params: { id: string };
}

export default async function NoteDetailPage({ params }: NotePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const note = await prisma.noteSet.findFirst({
    where: noteAccessById(params.id, session.user.id, session.user.email),
    include: {
      quizzes: {
        orderBy: { createdAt: "desc" },
      },
      collaborators: { orderBy: { createdAt: "asc" } },
      flashcardSets: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { flashcards: true } } },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!note) {
    notFound();
  }

  const latestQuiz = note.quizzes[0];
  const isOwner = note.userId === session.user.id;
  const ownerLabel = note.user?.name ?? note.user?.email ?? "Unknown teammate";
  const collaboratorCount = note.collaborators.length;
  const wordCount = note.rawContent.trim() ? note.rawContent.trim().split(/\s+/).length : 0;
  const stats = [
    { label: "Quizzes", value: note.quizzes.length },
    { label: "Flashcard sets", value: note.flashcardSets.length },
  ];
  if (collaborationEnabled) {
    stats.push({ label: "Collaborators", value: collaboratorCount });
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
        <Card className="border-border-subtle/70 bg-gradient-to-br from-bg-soft via-bg-soft/80 to-bg-elevated p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Note set</p>
          <h1 className="mt-2 text-3xl font-semibold text-text-main">{note.title}</h1>
          {!isOwner && collaborationEnabled && (
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-accent">
              Shared by {note.user?.name ?? note.user?.email ?? "teammate"}
            </p>
          )}
          <p className="mt-4 max-w-2xl text-sm text-text-muted">
            Generate guided practice or flashcards on demand. Your private workspace keeps the messy transcript intact so you
            can revisit or regenerate at any time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionModal
              triggerLabel={latestQuiz ? "Regenerate quiz" : "Generate quiz"}
              title="Create a quiz"
              description="Tune the number of prompts and jump right into a fresh attempt."
            >
              <GenerateQuizButton noteSetId={note.id} existingQuizId={latestQuiz?.id} />
            </ActionModal>
            <ActionModal
              triggerLabel="Generate flashcards"
              triggerVariant="secondary"
              title="Spin up flashcards"
              description="Name the deck, choose the card count, and we will auto-link it to this note set."
            >
              <GenerateFlashcardsButton noteSetId={note.id} defaultTitle={`${note.title} flashcards`} />
            </ActionModal>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/60 px-4 py-3 text-text-main"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-border-subtle/70 bg-bg-soft/70 p-6">
          <CardTitle>Workspace actions</CardTitle>
          <CardDescription className="mt-1">
            {collaborationEnabled ? "Share access, manage collaborators, or clean up." : "Collaboration tools are temporarily paused."}
          </CardDescription>
          <dl className="mt-6 space-y-4 text-sm text-text-main">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Owner</dt>
              <dd className="font-medium">{ownerLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Created</dt>
              <dd className="font-medium">{dateFormatter.format(note.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-text-muted">Updated</dt>
              <dd className="font-medium">{dateFormatter.format(note.updatedAt)}</dd>
            </div>
            {collaborationEnabled && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Collaborators</dt>
                <dd className="font-medium">{collaboratorCount}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 space-y-4">
            {collaborationEnabled ? (
              <ShareLinkButton actionPath={`/api/notes/${note.id}/share`} label="Share notes" />
            ) : (
              <p className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
                Sharing is temporarily disabled.
              </p>
            )}
            {isOwner && <NoteDeleteButton noteId={note.id} />}
          </div>
        </Card>
      </section>

      <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
        <CardTitle>Raw notes</CardTitle>
        <CardDescription className="mt-1">
          {wordCount.toLocaleString()} words · scroll to review the original transcript.
        </CardDescription>
        <div className="mt-4 max-h-[480px] overflow-y-auto rounded-3xl border border-border-subtle/70 bg-bg-elevated/60 px-4 py-5 text-sm leading-relaxed text-text-main">
          <pre className="whitespace-pre-wrap font-sans text-base text-text-main">{note.rawContent}</pre>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
          <CardTitle>Quizzes</CardTitle>
          <CardDescription className="mt-1">Retake or review previous attempts.</CardDescription>
          <div className="mt-4 space-y-3">
            {note.quizzes.length === 0 && <p className="text-text-muted">No quizzes yet. Generate one above.</p>}
            {note.quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle/70 bg-bg-elevated/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text-main">{quiz.title}</p>
                  <p className="text-xs text-text-muted">{dateTimeFormatter.format(quiz.createdAt)}</p>
                </div>
                <LinkButton href={`/quizzes/${quiz.id}/take`} className="px-3 py-1.5 text-xs font-semibold md:text-sm">
                  Take quiz
                </LinkButton>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
          <CardTitle>Flashcards</CardTitle>
          <CardDescription className="mt-1">Flip-friendly summaries generated from these notes.</CardDescription>
          <div className="mt-4 space-y-3">
            {note.flashcardSets.length === 0 && <p className="text-text-muted">No flashcards yet.</p>}
            {note.flashcardSets.map((set) => (
              <div
                key={set.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle/70 bg-bg-elevated/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text-main">{set.title}</p>
                  <p className="text-xs text-text-muted">
                    {set._count.flashcards} cards · {dateFormatter.format(set.createdAt)}
                  </p>
                </div>
                <LinkButton href={`/flashcards/${set.id}`} className="px-3 py-1.5 text-xs md:text-sm">
                  Study
                </LinkButton>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {collaborationEnabled && (
        <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
          <CardTitle>Collaborators</CardTitle>
          <CardDescription className="mt-1">Invite classmates to edit notes and generate quizzes.</CardDescription>
          <div className="mt-4">
            <NoteCollaboratorsManager
              noteId={note.id}
              collaborators={note.collaborators.map((collaborator) => ({
                id: collaborator.id,
                collaboratorEmail: collaborator.collaboratorEmail,
                createdAt: collaborator.createdAt.toISOString(),
              }))}
              canManage={isOwner}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
