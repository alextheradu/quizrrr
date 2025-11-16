import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QuizRunner } from "@/components/forms/quiz-runner";
import { quizAccessById } from "@/lib/access";

type Choice = { label: string; value: string };

interface QuizTakePageProps {
  params: { id: string };
}

export default async function QuizTakePage({ params }: QuizTakePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const quiz = await prisma.quiz.findFirst({
    where: quizAccessById(params.id, session.user.id, session.user.email),
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });

  if (!quiz) {
    notFound();
  }

  const formattedQuiz = {
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      difficulty: question.difficulty,
      choices: (question.choices as Choice[] | null) ?? undefined,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase text-text-muted">Quiz</p>
        <h1 className="text-3xl font-semibold text-text">{quiz.title}</h1>
        <p className="text-text-muted">
          This session blends multiple-choice and short reflections pulled from your notes. Move at your pace, and slide the
          confidence marker after each question so we can personalize the recap.
        </p>
        <p className="text-text-muted">
          When you submit, Quizzr compares answers with how certain you felt and highlights what to revisit next.
        </p>
      </div>
      <QuizRunner quiz={formattedQuiz} />
    </div>
  );
}
