import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QuizEditor } from "@/components/forms/quiz-editor";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareLinkButton } from "@/components/forms/share-link-button";
import type { JsonValue } from "@/lib/quiz";
import { LinkButton } from "@/components/ui/link-button";
import { quizAccessById } from "@/lib/access";
import { TemplateToggle } from "@/components/forms/template-toggle";
import { ChallengeLinkButton } from "@/components/forms/challenge-link-button";
import { env } from "@/lib/env";
import { collaborationEnabled } from "@/lib/feature-flags";

interface QuizEditPageProps {
  params: { id: string };
}

const formatCorrectAnswer = (value: JsonValue): string => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => formatCorrectAnswer(entry)).join("\n");
  }
  if (value && typeof value === "object") {
    const entries = Object.values(value as Record<string, JsonValue>);
    return entries.map((entry) => formatCorrectAnswer(entry)).join("\n");
  }
  return "";
};

export default async function QuizEditPage({ params }: QuizEditPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const quiz = await prisma.quiz.findFirst({
    where: quizAccessById(params.id, session.user.id, session.user.email),
    include: {
      noteSet: true,
      questions: { orderBy: { createdAt: "asc" } },
      _count: { select: { attempts: true } },
      challenges: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!quiz) {
    notFound();
  }

  const appBaseUrl = env.NEXTAUTH_URL.replace(/\/$/, "");
  const activeChallenge = quiz.challenges[0];
  const collabEnabled = collaborationEnabled;

  const editableQuiz = {
    id: quiz.id,
    title: quiz.title,
    updatedAt: quiz.updatedAt.toISOString(),
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      explanation: question.explanation,
      choices: ((question.choices as Array<{ id?: string; label?: string; value?: string }> | null) ?? []).map(
        (choice, index) => ({
          id: choice?.id ?? `${question.id}-${index}`,
          label: choice?.label ?? String.fromCharCode(65 + index),
          value: choice?.value ?? "",
        })
      ),
      correctAnswer: formatCorrectAnswer(question.correctAnswer),
    })),
  } as const;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Quiz editor</p>
          <h1 className="text-3xl font-semibold text-text-main">{quiz.title}</h1>
          <p className="text-text-muted">Tune each prompt before sharing or retaking the quiz.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <LinkButton
              href={`/notes/${quiz.noteSetId}`}
              variant="ghost"
              className="px-3 py-1.5 text-xs md:text-sm"
            >
              View source notes
            </LinkButton>
            <span>·</span>
            <LinkButton
              href={`/quizzes/${quiz.id}/take`}
              variant="ghost"
              className="px-3 py-1.5 text-xs md:text-sm"
            >
              Preview quiz
            </LinkButton>
          </div>
        </div>
        <Badge className="bg-bg-soft text-text-main">
          {quiz.questions.length} questions · {quiz._count.attempts} attempts
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Editing tips</CardTitle>
          <CardDescription className="mt-1">
            Update prompts, difficulty, explanations, and accepted answers without regenerating the quiz.
          </CardDescription>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-main">
            <li>Use the quick navigation pills below to jump to any question.</li>
            <li>Add, remove, or rewrite answer choices—radio buttons make it easy to mark the correct one.</li>
            <li>Short answer fields accept multiple synonyms when separated by commas or new lines.</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>{collabEnabled ? "Share & challenge" : "Quiz details"}</CardTitle>
          <div className="mt-4 space-y-1 text-sm text-text-main">
            <p>Created: {quiz.createdAt.toLocaleDateString()}</p>
            <p>Last updated: {quiz.updatedAt.toLocaleString()}</p>
            <p>Attempts recorded: {quiz._count.attempts}</p>
          </div>
          <div className="mt-4 space-y-4">
            {collabEnabled ? (
              <ShareLinkButton actionPath={`/api/quizzes/${quiz.id}/share`} label="Share quiz" regenerateLabel="New link" />
            ) : (
              <p className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
                Sharing is temporarily disabled.
              </p>
            )}
            <TemplateToggle
              quizId={quiz.id}
              initialEnabled={quiz.isPublicTemplate}
              initialDescription={quiz.templateDescription}
            />
            {collabEnabled ? (
              <ChallengeLinkButton
                quizId={quiz.id}
                initialUrl={activeChallenge?.token ? `${appBaseUrl}/quizzes/challenge/${activeChallenge.token}` : undefined}
                initialExpiresAt={activeChallenge?.expiresAt?.toISOString() ?? null}
              />
            ) : (
              <div className="rounded-2xl border border-border-subtle/70 bg-bg-soft/60 px-4 py-3 text-sm text-text-muted">
                Classroom challenges are temporarily unavailable.
              </div>
            )}
          </div>
        </Card>
      </div>

      <QuizEditor quiz={editableQuiz} />
    </div>
  );
}
