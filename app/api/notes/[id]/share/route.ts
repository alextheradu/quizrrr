import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { noteAccessById } from "@/lib/access";
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

  const noteSet = await prisma.noteSet.findFirst({ where: noteAccessById(params.id, session.user.id, session.user.email) });
  if (!noteSet) {
    return NextResponse.json({ error: "Note set not found" }, { status: 404 });
  }

  let payload: SharePayload;
  try {
    payload = (await request.json()) as SharePayload;
  } catch {
    payload = undefined;
  }

  const regenerate = payload?.regenerate === true;
  const shareToken = regenerate || !noteSet.shareToken ? crypto.randomUUID() : noteSet.shareToken;

  const updated = await prisma.noteSet.update({
    where: { id: noteSet.id },
    data: { shareToken },
  });

  return NextResponse.json({ shareUrl: `${appBaseUrl}/share/notes/${updated.shareToken}` });
}
