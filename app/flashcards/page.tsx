import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

export default async function FlashcardsIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const flashcardSets = await prisma.flashcardSet.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      noteSet: { select: { id: true, title: true } },
      _count: { select: { flashcards: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Flashcards</p>
          <h1 className="text-3xl font-semibold text-text-main">AI-powered memory joggers</h1>
          <p className="text-text-muted">Generate decks from any note set and flip through them here.</p>
        </div>
        <LinkButton href="/notes" variant="ghost" className="px-3 py-1.5 text-xs md:text-sm">
          Build from notes
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {flashcardSets.map((set) => (
          <Card key={set.id} className="space-y-4">
            <div>
              <CardTitle>{set.title}</CardTitle>
              <CardDescription className="mt-1">
                {set._count.flashcards} cards · from {set.noteSet?.title ?? "unknown notes"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <LinkButton href={`/flashcards/${set.id}`} className="px-3 py-1.5 text-xs font-semibold md:text-sm">
                Study now
              </LinkButton>
              {set.noteSet && (
                <LinkButton
                  href={`/notes/${set.noteSet.id}`}
                  variant="ghost"
                  className="px-3 py-1.5 text-xs md:text-sm"
                >
                  View notes
                </LinkButton>
              )}
            </div>
          </Card>
        ))}
        {flashcardSets.length === 0 && (
          <Card>
            <CardTitle>No flashcards yet</CardTitle>
            <CardDescription className="mt-1">
              Visit any note set to generate your first deck.
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
