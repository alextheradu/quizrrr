import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { quizAccessById } from "@/lib/access";
import { collaborationEnabled } from "@/lib/feature-flags";

interface Params {
  params: { id: string };
}

const appBaseUrl = env.NEXTAUTH_URL.replace(/\/$/, "");

type SharePayload = { regenerate?: boolean } | undefined;

export async function POST(request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: quizAccessById(params.id, session.user.id, session.user.email) });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  let payload: SharePayload;
  try {
    payload = (await request.json()) as SharePayload;
  } catch {
    payload = undefined;
  }

  const regenerate = payload?.regenerate === true;
  const shareToken = regenerate || !quiz.shareToken ? crypto.randomUUID() : quiz.shareToken;

  const updated = await prisma.quiz.update({
    where: { id: quiz.id },
    data: { shareToken },
  });

  return NextResponse.json({ shareUrl: `${appBaseUrl}/share/quizzes/${updated.shareToken}` });
}
