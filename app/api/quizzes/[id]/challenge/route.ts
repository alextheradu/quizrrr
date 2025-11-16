import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { challengeRequestSchema } from "@/lib/validators";
import { collaborationEnabled } from "@/lib/feature-flags";

interface Params {
  params: { id: string };
}

const baseUrl = env.NEXTAUTH_URL.replace(/\/$/, "");

export async function POST(request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const payload = (await request.json().catch(() => ({}))) as unknown;
  const parsed = challengeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid challenge request", details: parsed.error.flatten() }, { status: 400 });
  }

  const expiresAt = parsed.data.expiresInMinutes
    ? new Date(Date.now() + parsed.data.expiresInMinutes * 60 * 1000)
    : null;
  const token = crypto.randomUUID();

  await prisma.$transaction([
    prisma.classroomChallenge.deleteMany({ where: { quizId: quiz.id } }),
    prisma.classroomChallenge.create({
      data: { quizId: quiz.id, token, expiresAt },
    }),
  ]);

  return NextResponse.json({ shareUrl: `${baseUrl}/quizzes/challenge/${token}`, expiresAt });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await prisma.classroomChallenge.deleteMany({ where: { quizId: quiz.id } });
  return NextResponse.json({ success: true });
}
