import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { quizUpdateSchema } from "@/lib/validators";
import { quizAccessById } from "@/lib/access";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({
    where: quizAccessById(params.id, session.user.id, session.user.email),
    include: {
      questions: {
        orderBy: { createdAt: "asc" },
      },
      noteSet: true,
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json({ quiz });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const existingQuiz = await prisma.quiz.findFirst({
    where: quizAccessById(params.id, session.user.id, session.user.email),
    include: { questions: true },
  });

  if (!existingQuiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = quizUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const questionIds = new Set(existingQuiz.questions.map((question) => question.id));
  const unknownQuestions = parsed.data.questions.filter((question) => !questionIds.has(question.id));
  if (unknownQuestions.length > 0) {
    return NextResponse.json({ error: "Question mismatch" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.quiz.update({
      where: { id: existingQuiz.id },
      data: { title: parsed.data.title },
    }),
    ...parsed.data.questions.map((question) =>
      prisma.question.update({
        where: { id: question.id },
        data: {
          prompt: question.prompt,
          type: question.type,
          difficulty: question.difficulty,
          explanation: question.explanation,
          choices:
            question.type === "MULTIPLE_CHOICE"
              ? ((question.choices ?? []) as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          correctAnswer: question.correctAnswer as Prisma.InputJsonValue,
        },
      })
    ),
  ]);

  const updatedQuiz = await prisma.quiz.findUnique({
    where: { id: existingQuiz.id },
    include: { questions: { orderBy: { createdAt: "asc" } }, noteSet: true },
  });

  return NextResponse.json({ quiz: updatedQuiz });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: quizAccessById(params.id, session.user.id, session.user.email) });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await prisma.quiz.delete({ where: { id: quiz.id } });

  return NextResponse.json({ success: true });
}
