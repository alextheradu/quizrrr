import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FlashcardViewer } from "@/components/forms/flashcard-viewer";
import { FlashcardDeleteButton } from "@/components/forms/flashcard-delete-button";
import { LinkButton } from "@/components/ui/link-button";
import { FlashcardEditor } from "@/components/forms/flashcard-editor";
import { ActionModal } from "@/components/ui/action-modal";

interface FlashcardDetailPageProps {
  params: { id: string };
}

export default async function FlashcardDetailPage({ params }: FlashcardDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const flashcardSet = await prisma.flashcardSet.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      flashcards: { orderBy: { createdAt: "asc" } },
      noteSet: { select: { id: true, title: true } },
    },
  });

  if (!flashcardSet) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Flashcard set</p>
          <h1 className="text-3xl font-semibold text-text-main">{flashcardSet.title}</h1>
          <p className="text-sm text-text-muted">
            {flashcardSet.flashcards.length} cards · Linked to {flashcardSet.noteSet?.title ?? "notes"}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ActionModal
            triggerLabel="Edit flashcards"
            triggerVariant="secondary"
            title="Edit this deck"
            description="Adjust prompts, answers, or add fresh cards without leaving study mode."
          >
            <FlashcardEditor
              flashcardSetId={flashcardSet.id}
              initialTitle={flashcardSet.title}
              initialCards={flashcardSet.flashcards}
            />
          </ActionModal>
          {flashcardSet.noteSet && (
            <LinkButton href={`/notes/${flashcardSet.noteSet.id}`} variant="ghost">
              View notes
            </LinkButton>
          )}
          <FlashcardDeleteButton flashcardSetId={flashcardSet.id} redirectTo="/flashcards" />
        </div>
      </div>

      <Card>
        <CardTitle>Study session</CardTitle>
        <CardDescription className="mt-1">
          Tap the card to flip between prompt and answer. Use the edit button above to tweak this deck without leaving the page.
        </CardDescription>
        <div className="mt-4">
          <FlashcardViewer flashcards={flashcardSet.flashcards} />
        </div>
      </Card>
    </div>
  );
}
