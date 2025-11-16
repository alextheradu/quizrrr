import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

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
        <p className="text-text-muted">Browse ready-made quizzes and remix them for your classes.</p>
      </div>

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
            <CardTitle>No templates yet</CardTitle>
            <CardDescription className="mt-1">Publish a quiz from the editor to see it here.</CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
