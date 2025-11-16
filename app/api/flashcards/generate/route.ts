import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { flashcardGenerateSchema } from "@/lib/validators";
import { noteAccessById } from "@/lib/access";
import { generateFlashcards } from "@/lib/openrouter";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = flashcardGenerateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const noteSet = await prisma.noteSet.findFirst({
    where: noteAccessById(parsed.data.noteSetId, session.user.id, session.user.email),
  });

  if (!noteSet) {
    return NextResponse.json({ error: "Note set not found" }, { status: 404 });
  }

  let flashcards: Awaited<ReturnType<typeof generateFlashcards>>;
  try {
    flashcards = await generateFlashcards({
      title: noteSet.title,
      rawContent: noteSet.rawContent,
      cardCount: parsed.data.cardCount,
    });
  } catch (error) {
    console.error("Flashcard generation failed", error);
    return NextResponse.json({ error: "We couldn't create flashcards right now." }, { status: 502 });
  }

  const title = parsed.data.title?.trim() || `${noteSet.title} Flashcards`;

  const flashcardSet = await prisma.flashcardSet.create({
    data: {
      title,
      userId: session.user.id,
      noteSetId: noteSet.id,
      flashcards: {
        create: flashcards.map((card) => ({ front: card.front, back: card.back })),
      },
    },
    include: { flashcards: true, noteSet: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ flashcardSet });
}
