import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestionExplanation } from "@/lib/openrouter";
import { canonicalizeCorrectAnswer, stringifyAnswer } from "@/lib/quiz";

interface Params {
  params: { id: string; attemptId: string; responseId: string };
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const responseRecord = await prisma.questionResponse.findFirst({
    where: {
      id: params.responseId,
      quizAttemptId: params.attemptId,
      attempt: { quizId: params.id, userId: session.user.id },
    },
    include: {
      question: true,
      attempt: { include: { quiz: true } },
    },
  });

  if (!responseRecord) {
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }

  if (responseRecord.feedback) {
    return NextResponse.json({ feedback: responseRecord.feedback });
  }

  try {
    const canonicalAnswer = canonicalizeCorrectAnswer({
      type: responseRecord.question.type,
      correctAnswer: responseRecord.question.correctAnswer,
      choices: responseRecord.question.choices,
    });

    const explanation = await generateQuestionExplanation({
      quizTitle: responseRecord.attempt.quiz.title,
      prompt: responseRecord.question.prompt,
      correctAnswer: stringifyAnswer(canonicalAnswer),
      userAnswer: stringifyAnswer(responseRecord.userAnswer),
      difficulty: String(responseRecord.question.difficulty),
    });

    await prisma.questionResponse.update({
      where: { id: responseRecord.id },
      data: { feedback: explanation },
    });

    return NextResponse.json({ feedback: explanation });
  } catch (error) {
    console.error("Failed to generate question explanation", error);
    return NextResponse.json({ error: "We couldn’t generate that explanation. Try again." }, { status: 502 });
  }
}
