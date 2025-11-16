import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { collaborationEnabled } from "@/lib/feature-flags";

interface Params {
  params: { token: string };
}

export async function POST(_request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const challenge = await prisma.classroomChallenge.findFirst({
    where: { token: params.token },
    include: { quiz: true },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (challenge.expiresAt && challenge.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This challenge has expired" }, { status: 400 });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: challenge.quizId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ attemptId: attempt.id, quizId: challenge.quizId });
}
