import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitAttemptSchema } from "@/lib/validators";
import { isAnswerCorrect, normalizeUserAnswer, stringifyAnswer, canonicalizeCorrectAnswer, buildAttemptSummary } from "@/lib/quiz";

interface Params {
  params: { id: string; attemptId: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = submitAttemptSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid responses", details: parsed.error.flatten() }, { status: 400 });
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: params.attemptId, quizId: params.id, userId: session.user.id },
    include: { quiz: { include: { questions: true } } },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.completedAt) {
    return NextResponse.json({ error: "This attempt was already submitted" }, { status: 400 });
  }

  type QuizQuestion = (typeof attempt.quiz.questions)[number];
  type NormalizedAnswer = ReturnType<typeof normalizeUserAnswer>;
  const questionMap = new Map<string, QuizQuestion>(attempt.quiz.questions.map((q) => [q.id, q]));

  let graded: Array<{
    question: QuizQuestion;
    normalizedAnswer: NormalizedAnswer;
    confidence: number | undefined;
    isCorrect: boolean;
    canonicalCorrectAnswer: ReturnType<typeof canonicalizeCorrectAnswer>;
  }>;
  try {
    graded = parsed.data.responses.map((response) => {
      const question = questionMap.get(response.questionId);
      if (!question) {
        throw new Error(`Unknown question ${response.questionId}`);
      }
      const normalizedAnswer = normalizeUserAnswer(response.userAnswer);
      const canonicalCorrectAnswer = canonicalizeCorrectAnswer({
        type: question.type,
        correctAnswer: question.correctAnswer,
        choices: question.choices,
      });
      const correct = isAnswerCorrect({ correctAnswer: canonicalCorrectAnswer }, normalizedAnswer);
      return {
        question,
        normalizedAnswer,
        confidence: response.confidence,
        isCorrect: correct,
        canonicalCorrectAnswer,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid question";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const total = attempt.quiz.questions.length;
  const correctCount = graded.filter((entry) => entry.isCorrect).length;
  const score = total > 0 ? Number(((correctCount / total) * 100).toFixed(1)) : 0;

  const summaryText = buildAttemptSummary(score);

  await prisma.$transaction([
    prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        completedAt: new Date(),
        score,
        summaryFeedback: summaryText,
        studyRoadmap: null,
      },
    }),
    ...graded.map((entry) =>
      prisma.questionResponse.create({
        data: {
          quizAttemptId: attempt.id,
          questionId: entry.question.id,
          userAnswer: entry.normalizedAnswer as Prisma.InputJsonValue,
          isCorrect: entry.isCorrect,
          confidence: entry.confidence,
          feedback: null,
        },
      })
    ),
  ]);

  return NextResponse.json({
    score,
    summary: summaryText,
    roadmap: "",
    perQuestion: graded.map((entry) => ({
      questionId: entry.question.id,
      prompt: entry.question.prompt,
      userAnswer: stringifyAnswer(entry.normalizedAnswer),
      correctAnswer: stringifyAnswer(entry.canonicalCorrectAnswer),
      explanation: entry.question.explanation,
      difficulty: entry.question.difficulty,
      isCorrect: entry.isCorrect,
      confidence: entry.confidence,
      feedback: null,
    })),
  });
}
