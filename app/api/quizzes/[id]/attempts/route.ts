import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { quizAccessById } from "@/lib/access";

interface Params {
  params: { id: string };
}

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: quizAccessById(params.id, session.user.id, session.user.email) });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ attemptId: attempt.id });
}
