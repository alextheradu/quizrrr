import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { collaboratorInputSchema } from "@/lib/validators";
import { collaborationEnabled } from "@/lib/feature-flags";

interface Params {
  params: { id: string };
}

const deleteCollaboratorSchema = z.object({
  collaboratorId: z.string().min(1, "Collaborator id is required"),
});

const serializeError = (error: unknown, fallback: string) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "This collaborator already has access.";
    }
  }
  return fallback;
};

export async function POST(request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const note = await prisma.noteSet.findUnique({ where: { id: params.id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Only the note owner can add collaborators" }, { status: 403 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = collaboratorInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email", details: parsed.error.flatten() }, { status: 400 });
  }

  const ownerEmail = session.user.email?.toLowerCase();
  if (ownerEmail && parsed.data.email === ownerEmail) {
    return NextResponse.json({ error: "You already own this note set." }, { status: 400 });
  }

  try {
    await prisma.noteCollaborator.create({
      data: { noteSetId: note.id, collaboratorEmail: parsed.data.email },
    });
  } catch (error) {
    return NextResponse.json({ error: serializeError(error, "Unable to add collaborator.") }, { status: 400 });
  }

  const collaborators = await prisma.noteCollaborator.findMany({
    where: { noteSetId: note.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ collaborators });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!collaborationEnabled) {
    return NextResponse.json({ error: "Collaboration features are temporarily unavailable." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const note = await prisma.noteSet.findUnique({ where: { id: params.id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Only the note owner can remove collaborators" }, { status: 403 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = deleteCollaboratorSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid collaborator" }, { status: 400 });
  }

  await prisma.noteCollaborator.deleteMany({ where: { id: parsed.data.collaboratorId, noteSetId: note.id } });

  const collaborators = await prisma.noteCollaborator.findMany({
    where: { noteSetId: note.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ collaborators });
}
