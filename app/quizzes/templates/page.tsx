import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

const FUTURE_GALLERY_SECTIONS = [
  {
    title: "Curated template shelves",
    detail: "Tagging, search, difficulty filters, and remix stats will help you find the perfect starting point.",
  },
  {
    title: "Collaboration + sharing",
    detail:
      "Regenerated share links, classroom challenge playlists, and opt-in collaborator invites return once we finish the new moderation flow.",
  },
  {
    title: "Notes ↔ quiz cross-posting",
    detail: "Public notes, flashcards, and quizzes will live side-by-side so you can clone an entire study stack in one click.",
  },
];

export default async function QuizTemplateGalleryPage() {
  const templates = await prisma.quiz.findMany({
    where: { isPublicTemplate: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      noteSet: { select: { title: true, shareToken: true } },
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Community gallery</p>
        <h1 className="text-3xl font-semibold text-text-main">Popular study templates</h1>
        <p className="text-text-muted">
          Work in progress: we’re rebuilding this gallery with filters, remix stats, and safer collaboration tooling.
        </p>
        <p className="text-xs text-text-muted">
          Until then, you’ll just see recently published templates—expect frequent updates as the collaboration relaunch ships.
        </p>
      </div>

      <Card className="border-dashed border-accent/50 bg-accent/5">
        <CardTitle>This gallery relaunch is underway</CardTitle>
        <CardDescription className="mt-1 text-text-main">
          Here’s what the finished experience will include, alongside the returning share features like collaboration links and
          classroom challenges:
        </CardDescription>
        <ul className="mt-4 space-y-3 text-sm text-text-main">
          {FUTURE_GALLERY_SECTIONS.map((section) => (
            <li key={section.title} className="rounded-2xl border border-border-subtle/70 bg-bg-soft/70 px-4 py-3">
              <p className="font-semibold">{section.title}</p>
              <p className="text-text-muted">{section.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="space-y-3">
            <div>
              <CardTitle>{template.title}</CardTitle>
              <CardDescription className="mt-1">
                Updated {template.updatedAt.toLocaleDateString()} · {template._count.questions} questions
              </CardDescription>
            </div>
            {template.templateDescription && (
              <p className="text-sm text-text-main">{template.templateDescription}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              {template.shareToken ? (
                <LinkButton
                  href={`/share/quizzes/${template.shareToken}`}
                  className="px-3 py-1.5 text-xs font-semibold md:text-sm"
                >
                  Preview quiz
                </LinkButton>
              ) : (
                <LinkButton href="/" className="px-3 py-1.5 text-xs font-semibold md:text-sm">
                  Sign in to clone
                </LinkButton>
              )}
              {template.noteSet?.shareToken && (
                <LinkButton
                  href={`/share/notes/${template.noteSet.shareToken}`}
                  variant="ghost"
                  className="px-3 py-1.5 text-xs md:text-sm"
                >
                  View notes
                </LinkButton>
              )}
            </div>
          </Card>
        ))}
        {templates.length === 0 && (
          <Card>
            <CardTitle>Templates rolling out</CardTitle>
            <CardDescription className="mt-1">
              Publish a quiz from the editor to see it here once the gallery relaunch is complete.
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
