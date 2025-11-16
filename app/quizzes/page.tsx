import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizDeleteButton } from "@/components/forms/quiz-delete-button";
import { ShareLinkButton } from "@/components/forms/share-link-button";
import { LinkButton } from "@/components/ui/link-button";
import { collaborationEnabled } from "@/lib/feature-flags";

export default async function QuizzesIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const quizzes = await prisma.quiz.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      noteSet: { select: { id: true, title: true } },
      _count: { select: { attempts: true, questions: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Quizzes</p>
          <h1 className="text-3xl font-semibold text-text-main">All practice sets</h1>
          <p className="text-text-muted">
            {collaborationEnabled ? "Take, edit, share, or retire quizzes whenever you like." : "Take, edit, or retire quizzes whenever you like."}
          </p>
        </div>
        <LinkButton href="/notes" variant="ghost" className="px-3 py-1.5 text-xs md:text-sm">
          Build from notes
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription className="mt-1">
                  {quiz._count.questions} questions · {quiz.noteSet?.title ?? "No source"}
                </CardDescription>
              </div>
              <div className="space-y-2 text-right">
                <Badge className="bg-accent-soft/60 text-accent-strong">
                  {quiz._count.attempts} attempts
                </Badge>
                {quiz.isPublicTemplate && (
                  <Badge className="bg-emerald-500/20 text-emerald-700">Template</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <LinkButton href={`/quizzes/${quiz.id}/take`} className="px-3 py-1.5 text-xs font-semibold md:text-sm">
                Take
              </LinkButton>
              <LinkButton
                href={`/quizzes/${quiz.id}/edit`}
                variant="secondary"
                className="px-3 py-1.5 text-xs md:text-sm"
              >
                Edit
              </LinkButton>
              {quiz.noteSet && (
                <LinkButton
                  href={`/notes/${quiz.noteSet.id}`}
                  variant="ghost"
                  className="px-3 py-1.5 text-xs md:text-sm"
                >
                  Notes
                </LinkButton>
              )}
            </div>
            {collaborationEnabled ? (
              <ShareLinkButton actionPath={`/api/quizzes/${quiz.id}/share`} label="Share" regenerateLabel="Refresh link" />
            ) : (
              <p className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
                Sharing is temporarily disabled.
              </p>
            )}
            <QuizDeleteButton quizId={quiz.id} label="Delete" />
          </Card>
        ))}
        {quizzes.length === 0 && (
          <Card>
            <CardTitle>No quizzes yet</CardTitle>
            <CardDescription className="mt-1">Generate a quiz from any note set to get started.</CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}
