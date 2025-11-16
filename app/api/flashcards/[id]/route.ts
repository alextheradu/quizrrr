import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { flashcardUpdateSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const flashcardSet = await prisma.flashcardSet.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!flashcardSet) {
    return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 });
  }

  await prisma.flashcardSet.delete({ where: { id: flashcardSet.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const flashcardSet = await prisma.flashcardSet.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!flashcardSet) {
    return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = flashcardUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, flashcards } = parsed.data;
  const cardsWithIds = flashcards.filter((card) => Boolean(card.id));
  const cardsToCreate = flashcards.filter((card) => !card.id);
  const idsToKeep = cardsWithIds.map((card) => card.id!);

  try {
    await prisma.$transaction(async (tx) => {
      if (typeof title === "string" && title !== flashcardSet.title) {
        await tx.flashcardSet.update({ where: { id: flashcardSet.id }, data: { title } });
      }

      if (idsToKeep.length > 0) {
        await tx.flashcard.deleteMany({
          where: {
            flashcardSetId: flashcardSet.id,
            id: { notIn: idsToKeep },
          },
        });
      } else {
        await tx.flashcard.deleteMany({ where: { flashcardSetId: flashcardSet.id } });
      }

      if (cardsWithIds.length > 0) {
        for (const card of cardsWithIds) {
          await tx.flashcard.update({
            where: { id: card.id, flashcardSetId: flashcardSet.id },
            data: { front: card.front.trim(), back: card.back.trim() },
          });
        }
      }

      if (cardsToCreate.length > 0) {
        await tx.flashcard.createMany({
          data: cardsToCreate.map((card) => ({
            flashcardSetId: flashcardSet.id,
            front: card.front.trim(),
            back: card.back.trim(),
          })),
        });
      }
    });
  } catch (error) {
    console.error("Failed to update flashcards", error);
    return NextResponse.json({ error: "Unable to update flashcards" }, { status: 500 });
  }

  revalidatePath(`/flashcards/${params.id}`);
  revalidatePath("/flashcards");

  return NextResponse.json({ success: true });
}
