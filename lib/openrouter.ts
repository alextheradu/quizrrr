import { env } from "@/lib/env";
import { z } from "zod";
import type { JsonValue } from "@/lib/quiz";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const choiceSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const generatedQuestionSchema = z.object({
  prompt: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  choices: z.array(choiceSchema).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.string()), z.record(z.string(), z.unknown())]),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const generatedFlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

const generatedFeedbackSchema = z.object({
  summary: z.string(),
  roadmap: z.string(),
  perQuestion: z.array(
    z.object({
      questionId: z.string().optional(),
      prompt: z.string(),
      feedback: z.string(),
    })
  ),
});

const questionExplanationSchema = z.object({
  explanation: z.string(),
});

const completionSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().optional(),
      }),
    })
  ),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedFeedback = z.infer<typeof generatedFeedbackSchema>;
export type GeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>;
export type GeneratedQuestionExplanation = z.infer<typeof questionExplanationSchema>;

async function callOpenRouter(messages: Array<{ role: "system" | "user"; content: string }>): Promise<unknown> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your env.");
  }

  const referer = (() => {
    try {
      return new URL(env.NEXTAUTH_URL).origin;
    } catch {
      return env.NEXTAUTH_URL;
    }
  })();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": referer,
      "X-Title": env.APP_NAME,
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${errorPayload}`);
  }

  const completion = completionSchema.parse(await response.json());
  const content: string | undefined = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter response did not include content");
  }

  const sanitized = content.replace(/```json|```/g, "").trim();
  const parsed: unknown = JSON.parse(sanitized) as unknown;
  return parsed;
}

export async function generateQuizQuestions(noteSet: {
  title: string;
  rawContent: string;
  multipleChoiceCount: number;
  shortAnswerCount: number;
}) {
  const totalQuestions = noteSet.multipleChoiceCount + noteSet.shortAnswerCount;

  const payload = await callOpenRouter([
    {
      role: "system",
      content:
        "You turn study notes into diverse, pedagogically sound quiz questions. Always respond with strict JSON following the provided schema.",
    },
    {
      role: "user",
      content: `Create exactly ${totalQuestions} questions covering the highest-yield facts and concepts from the following notes. Produce ${noteSet.multipleChoiceCount} MULTIPLE_CHOICE questions (each with exactly 4 options labelled A-D) and ${noteSet.shortAnswerCount} SHORT_ANSWER questions. If either requested count is zero, omit that type entirely. Mix easy, medium, and hard difficulty overall. For multiple choice options, use a "label" for the single-letter identifier (A, B, C, D) and a "value" for the full student-facing text. Provide strictly valid JSON with the schema { "questions": [ { "prompt": string, "type": "MULTIPLE_CHOICE"|"SHORT_ANSWER", "choices": [{"label": string, "value": string}]?, "correctAnswer": string|array|object, "explanation": string, "difficulty": "EASY"|"MEDIUM"|"HARD" } ] }. Notes titled "${noteSet.title}":\n${noteSet.rawContent}`,
    },
  ]);

  const result = z
    .object({
      questions: z.array(generatedQuestionSchema),
    })
    .safeParse(payload);

  if (!result.success) {
    console.error("Invalid OpenRouter question payload", result.error.format());
    throw new Error("We could not understand the quiz generator response. Please try again.");
  }

  const requested = {
    multipleChoice: noteSet.multipleChoiceCount,
    shortAnswer: noteSet.shortAnswerCount,
  };

  const limited: GeneratedQuestion[] = [];
  let mcUsed = 0;
  let shortUsed = 0;

  for (const question of result.data.questions) {
    if (question.type === "MULTIPLE_CHOICE") {
      if (mcUsed >= requested.multipleChoice) {
        continue;
      }
      mcUsed += 1;
      limited.push(question);
    } else {
      if (shortUsed >= requested.shortAnswer) {
        continue;
      }
      shortUsed += 1;
      limited.push(question);
    }

    if (limited.length === totalQuestions) {
      break;
    }
  }

  if (mcUsed < requested.multipleChoice || shortUsed < requested.shortAnswer) {
    console.error("Quiz generator mix mismatch", {
      requested,
      received: {
        multipleChoice: mcUsed,
        shortAnswer: shortUsed,
      },
    });
    throw new Error("We couldn’t match the requested question mix. Please try again.");
  }

  return limited;
}

export async function generateFlashcards(noteSet: { title: string; rawContent: string; cardCount: number }) {
  const payload = await callOpenRouter([
    {
      role: "system",
      content:
        "You turn detailed study notes into focused flashcards. Keep wording concise, actionable, and beginner friendly.",
    },
    {
      role: "user",
      content: `Create ${noteSet.cardCount} flashcards from the following notes titled "${noteSet.title}". Each flashcard must be JSON with {"front": string, "back": string}. The front should contain a single clear prompt or question. The back should provide the precise answer or explanation in 1-2 sentences. Notes:\n${noteSet.rawContent}`,
    },
  ]);

  const result = z
    .object({
      flashcards: z.array(generatedFlashcardSchema),
    })
    .safeParse(payload);

  if (!result.success) {
    console.error("Invalid OpenRouter flashcard payload", result.error.format());
    throw new Error("We could not understand the flashcard generator response. Please try again.");
  }

  return result.data.flashcards;
}

export async function generatePersonalizedFeedback(input: {
  title: string;
  score: number;
  missed: Array<{
    questionId: string;
    prompt: string;
    difficulty: string;
    correctAnswer: JsonValue;
    userAnswer: JsonValue;
    confidence?: number | null;
  }>;
}) {
  const payload = await callOpenRouter([
    {
      role: "system",
      content:
        "You are a kind study coach that explains strengths and weaknesses in a few warm paragraphs and concrete tips.",
    },
    {
      role: "user",
      content: `A student just scored ${input.score}% on the quiz "${input.title}". They missed the following questions: ${JSON.stringify(
        input.missed
      )}. Summarize strengths, weaknesses, and give a short roadmap. Respond as JSON with {"summary": string, "roadmap": string, "perQuestion": [{"questionId": string, "prompt": string, "feedback": string}]}.`,
    },
  ]);

  const result = generatedFeedbackSchema.safeParse(payload);
  if (!result.success) {
    console.error("Invalid OpenRouter feedback payload", result.error.format());
    throw new Error("We could not generate feedback right now. Please try again.");
  }

  return result.data;
}

export async function generateQuestionExplanation(input: {
  quizTitle: string;
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
  difficulty: string;
}) {
  const payload = await callOpenRouter([
    {
      role: "system",
      content: "You are a calm tutor. Explain why the correct answer is right in 2-3 short paragraphs with one actionable tip.",
    },
    {
      role: "user",
      content: `Quiz: ${input.quizTitle}
Question (${input.difficulty}): ${input.prompt}
Correct answer: ${input.correctAnswer}
Student answer: ${input.userAnswer}
Return JSON as {"explanation": string}.`,
    },
  ]);

  const result = questionExplanationSchema.safeParse(payload);
  if (!result.success) {
    console.error("Invalid OpenRouter question explanation payload", result.error.format());
    throw new Error("We couldn’t craft that explanation. Please try again.");
  }

  return result.data.explanation;
}
