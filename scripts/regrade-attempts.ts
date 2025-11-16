import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type JsonValue = Prisma.JsonValue;

type ChoiceJson = {
  label?: string;
  value?: string;
};

const isJsonRecord = (value: unknown): value is Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeText = (value: string) => value.trim().toLowerCase();

const toChoiceArray = (value: JsonValue | null | undefined): ChoiceJson[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return (value as JsonValue[]).filter((item): item is ChoiceJson => typeof item === "object" && item !== null);
};

function canonicalize(question: { type?: string; correctAnswer: JsonValue; choices?: JsonValue | null }) {
  if (question.type !== "MULTIPLE_CHOICE") {
    return question.correctAnswer;
  }
  if (typeof question.correctAnswer !== "string") {
    return question.correctAnswer;
  }
  const choices = toChoiceArray(question.choices);
  if (!choices.length) {
    return question.correctAnswer;
  }
  const normalized = normalizeText(question.correctAnswer);
  const labelMatch = choices.find((choice) => typeof choice.label === "string" && normalizeText(choice.label) === normalized);
  if (labelMatch?.value) {
    return labelMatch.value;
  }
  const valueMatch = choices.find((choice) => typeof choice.value === "string" && normalizeText(choice.value) === normalized);
  if (valueMatch?.value) {
    return valueMatch.value;
  }
  return question.correctAnswer;
}

const sanitizeText = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[≈~=]/g, " ")
    .replace(/×/g, "x")
    .replace(/[,:;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeNumberToken = (token: string) => {
  if (/^-?\d+(?:\.\d+)?$/.test(token)) {
    return Number(token).toString();
  }
  return token;
};

const tokenize = (text: string): string[] =>
  sanitizeText(text)
    .split(" ")
    .map((token) => normalizeNumberToken(token))
    .filter(Boolean);

const toArray = (value: JsonValue): string[] => {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => toArray(item));
  if (isJsonRecord(value)) {
    const flattened = Object.values(value).flatMap((item) => toArray(item));
    const combined = flattened.join(" ");
    return combined ? [combined] : flattened;
  }
  return [];
};

const toTokenSets = (value: JsonValue): string[][] =>
  toArray(value)
    .map((entry) => tokenize(entry))
    .filter((tokens) => tokens.length > 0);

const tokensMatch = (userTokens: string[], correctTokens: string[]) =>
  correctTokens.length > 0 && correctTokens.every((token) => userTokens.includes(token));

function isCorrect(question: { correctAnswer: JsonValue }, rawAnswer: JsonValue) {
  const userAnswers = toTokenSets(rawAnswer);
  const correctAnswers = toTokenSets(question.correctAnswer);
  if (!userAnswers.length || !correctAnswers.length) return false;
  return userAnswers.some((userTokens) => correctAnswers.some((correctTokens) => tokensMatch(userTokens, correctTokens)));
}

const summaryForScore = (score: number) => {
  if (score === 100) {
    return "Perfect score! Keep reinforcing these concepts to lock them in.";
  }
  if (score >= 80) {
    return "Strong work—scan the answer key below to tighten any shaky spots.";
  }
  return "Progress made. Review the explanations and re-run the quiz when ready.";
};

async function regradeAttempt(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        include: { question: true },
      },
    },
  });

  if (!attempt) {
    return;
  }

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  let correctCount = 0;

  for (const response of attempt.responses) {
    const canonicalAnswer = canonicalize({
      type: response.question.type,
      correctAnswer: response.question.correctAnswer,
      choices: response.question.choices,
    });
    const computedCorrect = isCorrect({ correctAnswer: canonicalAnswer }, response.userAnswer);
    if (computedCorrect) {
      correctCount += 1;
    }
    if (computedCorrect !== response.isCorrect) {
      updates.push(
        prisma.questionResponse.update({
          where: { id: response.id },
          data: { isCorrect: computedCorrect },
        })
      );
    }
  }

  const totalQuestions = attempt.responses.length;
  const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;
  const summary = summaryForScore(score);

  if ((attempt.score ?? 0) !== score || (attempt.summaryFeedback ?? "") !== summary) {
    updates.push(
      prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { score, summaryFeedback: summary },
      })
    );
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
    console.log(`Regraded attempt ${attempt.id} (score now ${score}%)`);
  }
}

async function main() {
  const attempts = await prisma.quizAttempt.findMany({ select: { id: true } });
  for (const attempt of attempts) {
    await regradeAttempt(attempt.id);
  }
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
