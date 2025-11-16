import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QuizRunner } from "@/components/forms/quiz-runner";
import { LinkButton } from "@/components/ui/link-button";
import { collaborationEnabled } from "@/lib/feature-flags";

interface ChallengePageProps {
  params: { token: string };
}

export default async function ClassroomChallengePage({ params }: ChallengePageProps) {
  if (!collaborationEnabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Challenges paused</p>
        <h1 className="text-3xl font-semibold text-text-main">Classroom challenges unavailable</h1>
        <p className="text-sm text-text-muted">Live challenge links are turned off right now. Try a regular quiz run instead.</p>
        <LinkButton href="/quizzes" className="px-4 py-2 text-sm">
          View quizzes
        </LinkButton>
      </div>
    );
  }
  const session = await auth();
  const challenge = await prisma.classroomChallenge.findFirst({
    where: { token: params.token },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { createdAt: "asc" } },
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!challenge) {
    notFound();
  }

  const isExpired = challenge.expiresAt ? challenge.expiresAt.getTime() < Date.now() : false;
  const formattedQuiz = {
    id: challenge.quiz.id,
    title: challenge.quiz.title,
    questions: challenge.quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      choices: question.choices as Array<{ label: string; value: string }> | undefined,
    })),
  } as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Classroom challenge</p>
        <h1 className="text-3xl font-semibold text-text-main">{challenge.quiz.title}</h1>
        <p className="text-sm text-text-muted">
          Hosted by {challenge.quiz.user?.name ?? "a Quizzr coach"}
        </p>
        {challenge.expiresAt && (
          <p className="text-xs uppercase tracking-[0.3em] text-accent">
            Expires {challenge.expiresAt.toLocaleString()}
          </p>
        )}
      </div>

      {!session?.user?.id && (
        <Card>
          <CardTitle>Sign in to join</CardTitle>
          <CardDescription className="mt-1">Log in to save your attempt and get feedback.</CardDescription>
          <div className="mt-4">
            <LinkButton href="/" className="px-3 py-1.5 text-xs md:text-sm">
              Sign in with email
            </LinkButton>
          </div>
        </Card>
      )}

      {session?.user?.id && isExpired && (
        <Card>
          <CardTitle>Challenge closed</CardTitle>
          <CardDescription className="mt-1">Ask the host to start a new window.</CardDescription>
        </Card>
      )}

      {session?.user?.id && !isExpired && (
        <QuizRunner quiz={formattedQuiz} attemptPath={`/api/quizzes/challenge/${params.token}/attempt`} />
      )}
    </div>
  );
}
