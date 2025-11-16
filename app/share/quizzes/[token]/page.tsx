import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface SharedQuizPageProps {
  params: { token: string };
}

export default async function SharedQuizPage({ params }: SharedQuizPageProps) {
  if (!collaborationEnabled) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Sharing paused</p>
        <h1 className="text-3xl font-semibold text-text-main">Collaboration temporarily disabled</h1>
        <p className="text-sm text-text-muted">
          Shared quiz previews are turned off right now. Ask the owner for direct access instead.
        </p>
        <LinkButton href="/" className="px-4 py-2 text-sm">
          Go home
        </LinkButton>
      </div>
    );
  }
  const quiz = await prisma.quiz.findFirst({
    where: { shareToken: params.token },
    include: {
      user: { select: { name: true } },
      noteSet: { select: { id: true, title: true, shareToken: true } },
      questions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quiz) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Shared quiz</p>
        <h1 className="text-3xl font-semibold text-text-main">{quiz.title}</h1>
        <p className="text-sm text-text-muted">
          Crafted by {quiz.user?.name ?? "a Quizzr student"} · {new Date(quiz.updatedAt).toLocaleDateString()}
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-text-muted">
          <span>{quiz.questions.length} questions</span>
          {quiz.noteSet && (
            <LinkButton
              href={quiz.noteSet.shareToken ? `/share/notes/${quiz.noteSet.shareToken}` : `/notes/${quiz.noteSet.id}`}
              variant="ghost"
              className="px-3 py-1.5 text-xs md:text-sm"
            >
              View source notes
            </LinkButton>
          )}
        </div>
        <LinkButton href="/" className="px-3 py-1.5 text-xs md:text-sm">
          Sign in to take this quiz
        </LinkButton>
      </div>

      <Card>
        <CardTitle>Questions</CardTitle>
        <CardDescription className="mt-1">Preview the prompts your friend sees.</CardDescription>
        <div className="mt-4 space-y-4">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-text-muted">
                <span>Question {index + 1}</span>
                <Badge className="bg-accent-soft/50 text-[0.65rem] text-accent-strong">{question.difficulty.toLowerCase()}</Badge>
              </div>
              <p className="mt-3 text-base font-medium text-text-main">{question.prompt}</p>
              <p className="mt-2 text-sm text-text-muted">
                {question.type === "MULTIPLE_CHOICE" ? "Multiple choice" : "Short answer"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
