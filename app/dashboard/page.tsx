import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { QuizDeleteButton } from "@/components/forms/quiz-delete-button";
import { LinkButton } from "@/components/ui/link-button";
import { noteAccessFilter } from "@/lib/access";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const [noteSets, attempts, quizzes, flashcardSets] = await Promise.all([
    prisma.noteSet.findMany({
      where: noteAccessFilter(session.user.id, session.user.email),
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.quizAttempt.findMany({
      where: { userId: session.user.id, completedAt: { not: null } },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
    prisma.quiz.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { questions: true, attempts: true } } },
    }),
    prisma.flashcardSet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        noteSet: { select: { id: true, title: true } },
        _count: { select: { flashcards: true } },
      },
    }),
  ]);

  type NoteSummary = (typeof noteSets)[number];
  type AttemptSummary = (typeof attempts)[number];
  type QuizSummary = (typeof quizzes)[number];
  type FlashcardSummary = (typeof flashcardSets)[number];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Dashboard</p>
          <h1 className="text-3xl font-semibold text-text-main">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="text-text-muted">Keep the momentum going with fresh quizzes and gentle coaching.</p>
        </div>
        <LinkButton href="/notes/new">Create new notes</LinkButton>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card id="notes">
          <CardTitle>Your note sets</CardTitle>
          <CardDescription className="mt-1">Paste lecture notes or upload study guides.</CardDescription>
          <div className="mt-4 space-y-3">
            {noteSets.length === 0 && <p className="text-text-muted">No notes yet. Start with your latest class.</p>}
            {noteSets.map((note: NoteSummary) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-2xl border border-transparent bg-bg-soft/70 px-4 py-3 transition hover:border-accent/60"
              >
                <p className="font-medium text-text-main">{note.title}</p>
                <p className="text-sm text-text-muted">
                  {new Date(note.createdAt).toLocaleDateString()} · {note.rawContent.length} characters
                </p>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Recent quizzes</CardTitle>
          <CardDescription className="mt-1">Review scores and keep practicing.</CardDescription>
          <div className="mt-4 space-y-3">
            {attempts.length === 0 && <p className="text-text-muted">No attempts yet. Generate a quiz to get started.</p>}
            {attempts.map((attempt: AttemptSummary) => (
              <Link
                key={attempt.id}
                href={`/quizzes/${attempt.quizId}/attempts/${attempt.id}`}
                className="flex items-center justify-between rounded-2xl border border-transparent bg-bg-soft/70 px-4 py-3 transition hover:border-accent/60"
              >
                <div>
                  <p className="font-medium text-text-main">{attempt.quiz.title}</p>
                  <p className="text-sm text-text-muted">
                    {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : "In progress"} · {attempt.score ?? "–"}%
                  </p>
                </div>
                {attempt.score != null && <Badge>{attempt.score}%</Badge>}
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section id="quizzes" className="space-y-6">
        <Card>
          <CardTitle>Available quizzes</CardTitle>
          <CardDescription className="mt-1">Regenerate or retake quizzes anytime.</CardDescription>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quizzes.length === 0 && <p className="text-text-muted">Create notes to unlock your first quiz.</p>}
            {quizzes.map((quiz: QuizSummary) => (
              <div key={quiz.id} className="rounded-2xl border border-border-subtle/60 bg-bg-soft px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-main">{quiz.title}</p>
                    <p className="text-xs text-text-muted">
                      Updated {new Date(quiz.updatedAt).toLocaleDateString()} · {quiz._count.questions} questions
                    </p>
                  </div>
                  <Badge className="bg-accent-soft/60 text-xs text-accent-strong">
                    {quiz._count.attempts} attempts
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <LinkButton
                    href={`/quizzes/${quiz.id}/take`}
                    className="px-3 py-1.5 text-xs font-semibold md:text-sm"
                  >
                    Take
                  </LinkButton>
                  <LinkButton
                    href={`/quizzes/${quiz.id}/edit`}
                    variant="secondary"
                    className="px-3 py-1.5 text-xs md:text-sm"
                  >
                    Edit
                  </LinkButton>
                  <LinkButton
                    href={`/notes/${quiz.noteSetId}`}
                    variant="ghost"
                    className="px-3 py-1.5 text-xs md:text-sm"
                  >
                    Notes
                  </LinkButton>
                  <QuizDeleteButton quizId={quiz.id} label="Delete" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Latest flashcards</CardTitle>
          <CardDescription className="mt-1">Flip through and keep your brain fresh.</CardDescription>
          <div className="mt-4 space-y-3">
            {flashcardSets.length === 0 && <p className="text-text-muted">Generate flashcards from any note set.</p>}
            {flashcardSets.map((set: FlashcardSummary) => (
              <Link
                href={`/flashcards/${set.id}`}
                key={set.id}
                className="flex items-center justify-between rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-3"
              >
                <div>
                  <p className="font-medium text-text-main">{set.title}</p>
                  <p className="text-xs text-text-muted">
                    Linked to {set.noteSet?.title ?? "notes"} · {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-accent-soft/60 text-accent-strong">{set._count.flashcards} cards</Badge>
              </Link>
            ))}
          </div>
          <LinkButton href="/flashcards" variant="ghost" className="mt-4 px-3 py-1.5 text-xs md:text-sm">
            View all flashcards
          </LinkButton>
        </Card>
      </section>
    </div>
  );
}
