import { Prisma } from "@prisma/client";

export type JsonValue = Prisma.JsonValue;

type ChoiceJson = {
  label?: string;
  value?: string;
};

const toChoiceArray = (value: JsonValue | null | undefined): ChoiceJson[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is ChoiceJson => typeof item === "object" && item !== null);
};

const isJsonRecord = (value: unknown): value is Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

export function isAnswerCorrect(question: { correctAnswer: JsonValue }, rawAnswer: JsonValue) {
  const userAnswers = toTokenSets(rawAnswer);
  const correctAnswers = toTokenSets(question.correctAnswer);
  if (!userAnswers.length || !correctAnswers.length) return false;
  return userAnswers.some((userTokens) => correctAnswers.some((correctTokens) => tokensMatch(userTokens, correctTokens)));
}

const normalizeText = (value: string) => value.trim().toLowerCase();

export function canonicalizeCorrectAnswer(question: {
  type?: string;
  correctAnswer: JsonValue;
  choices?: JsonValue | null;
}): JsonValue {
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
  const labelMatch = choices.find((choice) =>
    typeof choice.label === "string" && normalizeText(choice.label) === normalized
  );
  if (labelMatch?.value) {
    return labelMatch.value;
  }
  const valueMatch = choices.find((choice) =>
    typeof choice.value === "string" && normalizeText(choice.value) === normalized
  );
  if (valueMatch?.value) {
    return valueMatch.value;
  }
  return question.correctAnswer;
}

export function stringifyAnswer(value: JsonValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    return value.map((entry) => stringifyAnswer(entry)).join(", ");
  }
  if (isJsonRecord(value)) {
    return Object.values(value)
      .map((entry) => stringifyAnswer(entry))
      .join(", ");
  }
  return "";
}

export function normalizeUserAnswer(value: unknown): JsonValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeUserAnswer(entry));
  }
  if (isJsonRecord(value)) {
    return Object.entries(value).reduce<Record<string, JsonValue>>((acc, [key, val]) => {
      acc[key] = normalizeUserAnswer(val);
      return acc;
    }, {});
  }
  return "";
}

export const buildAttemptSummary = (score: number) => {
  if (score === 100) {
    return "Perfect score! Keep reinforcing these concepts to lock them in.";
  }
  if (score >= 80) {
    return "Strong work—scan the answer key below to tighten any shaky spots.";
  }
  return "Progress made. Review the explanations and re-run the quiz when ready.";
};
