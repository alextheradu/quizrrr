import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canonicalizeCorrectAnswer,
  stringifyAnswer,
  isAnswerCorrect,
  buildAttemptSummary,
  type JsonValue,
} from "@/lib/quiz";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { QuestionExplanationButton } from "@/components/forms/question-explanation-button";

interface AttemptPageProps {
  params: { id: string; attemptId: string };
}

export default async function QuizAttemptResultsPage({ params }: AttemptPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const attemptRecord = await prisma.quizAttempt.findFirst({
    where: { id: params.attemptId, quizId: params.id, userId: session.user.id },
    include: {
      quiz: true,
      responses: {
        include: { question: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attemptRecord) {
    notFound();
  }

  let attempt = attemptRecord;

  type ResponseItem = (typeof attempt.responses)[number];
  type HydratedResponse = ResponseItem & {
    canonicalAnswer: JsonValue;
    computedCorrect: boolean;
  };

  const canonicalizedEntries = attempt.responses.map((response: ResponseItem) => {
    const canonicalAnswer = canonicalizeCorrectAnswer({
      type: response.question.type,
      correctAnswer: response.question.correctAnswer,
      choices: response.question.choices,
    });
    const computedCorrect = isAnswerCorrect({ correctAnswer: canonicalAnswer }, response.userAnswer);
    return { responseId: response.id, canonicalAnswer, computedCorrect };
  });

  const canonicalMap = new Map(canonicalizedEntries.map((entry) => [entry.responseId, entry]));
  const totalQuestions = canonicalizedEntries.length;
  const computedCorrectCount = canonicalizedEntries.filter((entry) => entry.computedCorrect).length;
  const computedScore = totalQuestions > 0 ? Number(((computedCorrectCount / totalQuestions) * 100).toFixed(1)) : 0;
  const computedSummary = buildAttemptSummary(computedScore);

  const responseUpdates = canonicalizedEntries.filter((entry) => {
    const original = attempt.responses.find((response) => response.id === entry.responseId);
    return original ? original.isCorrect !== entry.computedCorrect : false;
  });

  const needsAttemptUpdate =
    (attempt.score ?? 0) !== computedScore || (attempt.summaryFeedback ?? "") !== computedSummary;

  if (responseUpdates.length > 0 || needsAttemptUpdate) {
    const writes: Prisma.PrismaPromise<unknown>[] = responseUpdates.map((entry) =>
      prisma.questionResponse.update({
        where: { id: entry.responseId },
        data: { isCorrect: entry.computedCorrect },
      })
    );
    if (needsAttemptUpdate) {
      writes.push(
        prisma.quizAttempt.update({
          where: { id: attempt.id },
          data: { score: computedScore, summaryFeedback: computedSummary },
        })
      );
    }
    if (writes.length > 0) {
      await prisma.$transaction(writes);
    }

    attempt = {
      ...attempt,
      score: needsAttemptUpdate ? computedScore : attempt.score,
      summaryFeedback: needsAttemptUpdate ? computedSummary : attempt.summaryFeedback,
      responses: attempt.responses.map((response) => {
        const recalculated = canonicalMap.get(response.id);
        return recalculated ? { ...response, isCorrect: recalculated.computedCorrect } : response;
      }),
    };
  }

  const hydratedResponses: HydratedResponse[] = attempt.responses.map((response: ResponseItem) => {
    const canonicalEntry = canonicalMap.get(response.id);
    const canonicalAnswer =
      canonicalEntry?.canonicalAnswer ??
      canonicalizeCorrectAnswer({
        type: response.question.type,
        correctAnswer: response.question.correctAnswer,
        choices: response.question.choices,
      });
    const computedCorrect = canonicalEntry?.computedCorrect ?? response.isCorrect;
    return { ...response, canonicalAnswer, computedCorrect };
  });

  const displayedScore = attempt.score ?? computedScore;
  const summaryText = attempt.summaryFeedback ?? computedSummary;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-text-muted">Results</p>
          <h1 className="text-3xl font-semibold text-text-main">{attempt.quiz.title}</h1>
          <p className="text-text-muted">
            Taken on {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : "In progress"}
          </p>
        </div>
        <LinkButton href={`/quizzes/${attempt.quizId}/take`} variant="secondary">
          Retake quiz
        </LinkButton>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Your score</CardTitle>
          <div className="mt-6">
            <p className="text-5xl font-semibold text-text-main">{displayedScore ?? "–"}%</p>
            <p className="mt-2 text-text-muted">Great work—review the highlights below.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>Summary</CardTitle>
          <CardDescription className="mt-1">Quick reflections</CardDescription>
          <p className="mt-4 whitespace-pre-wrap text-text-main">{summaryText ?? "Feedback incoming."}</p>
          {attempt.studyRoadmap && (
            <div className="mt-4 rounded-2xl border border-border-subtle/60 bg-bg-soft px-4 py-3 text-sm text-text-main">
              <p className="font-semibold">Study roadmap</p>
              <p className="mt-2 whitespace-pre-wrap">{attempt.studyRoadmap}</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Questions</CardTitle>
        <div className="mt-4 space-y-4">
          {hydratedResponses.map((response) => {
            const correctAnswerDisplay = stringifyAnswer(response.canonicalAnswer);

            return (
              <div
                key={response.id}
                className="rounded-2xl border border-border-subtle/70 bg-bg-soft/80 px-4 py-4 shadow-inner shadow-black/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
                    {response.question.type.toLowerCase()}
                  </p>
                  <Badge className={response.computedCorrect ? "bg-accent-soft text-accent-strong" : "bg-red-400/15 text-red-400"}>
                    {response.computedCorrect ? "Correct" : "Missed"}
                  </Badge>
                </div>
                <p className="mt-3 text-lg font-medium text-text-main">{response.question.prompt}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-text-main">Your answer:</span> {" "}
                    {stringifyAnswer(response.userAnswer)}
                  </p>
                  <p>
                    <span className="font-semibold text-text-main">Correct answer:</span> {" "}
                    {correctAnswerDisplay}
                  </p>
                  <p>
                    <span className="font-semibold text-text-main">Explanation:</span> {" "}
                    {response.question.explanation}
                  </p>
                  <QuestionExplanationButton
                    quizId={attempt.quizId}
                    attemptId={attempt.id}
                    responseId={response.id}
                    initialFeedback={response.feedback}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
