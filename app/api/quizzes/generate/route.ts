import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateQuizQuestions } from "@/lib/openrouter";
import { generateQuizSchema } from "@/lib/validators";
import { noteAccessById } from "@/lib/access";
import { canonicalizeCorrectAnswer, type JsonValue } from "@/lib/quiz";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = generateQuizSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const noteSet = await prisma.noteSet.findFirst({
    where: noteAccessById(parsed.data.noteSetId, session.user.id, session.user.email),
  });

  if (!noteSet) {
    return NextResponse.json({ error: "Note set not found" }, { status: 404 });
  }

  let questions: Awaited<ReturnType<typeof generateQuizQuestions>>;
  try {
    questions = await generateQuizQuestions({
      title: noteSet.title,
      rawContent: noteSet.rawContent,
      multipleChoiceCount: parsed.data.multipleChoiceCount,
      shortAnswerCount: parsed.data.shortAnswerCount,
    });
  } catch (error) {
    console.error("Quiz generation failed", error);
    return NextResponse.json({ error: "We couldn't create a quiz right now. Please try again." }, { status: 502 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: `${noteSet.title} Practice Quiz`,
      userId: session.user.id,
      noteSetId: noteSet.id,
      questions: {
        create: questions.map((question) => {
          const normalizedAnswer = canonicalizeCorrectAnswer({
            type: question.type,
            correctAnswer: question.correctAnswer as JsonValue,
            choices: question.choices ? (question.choices as JsonValue) : null,
          }) as Prisma.InputJsonValue;

          return {
          prompt: question.prompt,
          type: question.type,
          choices: question.choices ? (question.choices as Prisma.InputJsonValue) : Prisma.JsonNull,
            correctAnswer: normalizedAnswer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          };
        }),
      },
    },
  });

  return NextResponse.json({ quizId: quiz.id });
}
