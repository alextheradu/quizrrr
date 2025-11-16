import { z } from "zod";
import { MAX_QUIZ_QUESTIONS } from "@/lib/constants";

const MIN_QUIZ_QUESTION_TOTAL = 4;

export const noteInputSchema = z.object({
  title: z.string().min(3, "Title is too short").max(120),
  rawContent: z.string().min(30, "Please add more detail to your notes"),
  sourceType: z.enum(["PASTE", "DOC_UPLOAD"]).default("PASTE"),
});

export const documentImportSchema = z.object({
  title: z.string().min(3, "Title is too short").max(140),
});

export const collaboratorInputSchema = z.object({
  email: z
    .string()
    .min(3, "Email is required")
    .max(320, "Email is too long")
    .email("Provide a valid collaborator email")
    .transform((value) => value.trim().toLowerCase()),
});

export const generateQuizSchema = z
  .object({
    noteSetId: z.string().min(1, "Note set id is required"),
    multipleChoiceCount: z.coerce
      .number()
      .int()
      .min(0, "Multiple choice can be zero or more")
      .max(MAX_QUIZ_QUESTIONS, `Max ${MAX_QUIZ_QUESTIONS} questions total`)
      .default(8),
    shortAnswerCount: z.coerce
      .number()
      .int()
      .min(0, "Short answer can be zero or more")
      .max(MAX_QUIZ_QUESTIONS, `Max ${MAX_QUIZ_QUESTIONS} questions total`)
      .default(4),
  })
  .superRefine((value, ctx) => {
    const total = value.multipleChoiceCount + value.shortAnswerCount;
    if (total < MIN_QUIZ_QUESTION_TOTAL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ask for at least ${MIN_QUIZ_QUESTION_TOTAL} questions`,
        path: ["shortAnswerCount"],
      });
    }

    if (total > MAX_QUIZ_QUESTIONS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Limit quizzes to ${MAX_QUIZ_QUESTIONS} questions`,
        path: ["multipleChoiceCount"],
      });
    }

    if (value.multipleChoiceCount === 0 && value.shortAnswerCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Include at least one question type",
        path: ["multipleChoiceCount"],
      });
    }
  });

const quizChoiceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Choice text is required"),
});

const quizQuestionSchema = z
  .object({
    id: z.string().min(1, "Question id is required"),
    prompt: z.string().min(5, "Question needs more detail"),
    type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
    choices: z.array(quizChoiceSchema).optional(),
    correctAnswer: z.union([z.string(), z.number(), z.array(z.string()), z.record(z.string(), z.unknown())]),
    explanation: z.string().min(5, "Explanation should reassure students"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "MULTIPLE_CHOICE") {
      if (!value.choices || value.choices.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["choices"],
          message: "Multiple choice questions need at least two options",
        });
      }
    }
  });

export const quizUpdateSchema = z.object({
  title: z.string().min(3, "Title is too short").max(140, "Keep titles concise"),
  questions: z.array(quizQuestionSchema).min(1, "Include at least one question"),
});

export const submitAttemptSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1),
        userAnswer: z.union([z.string(), z.number(), z.array(z.string()), z.record(z.string(), z.any())]),
        confidence: z.number().min(1).max(5).optional(),
      })
    )
    .min(1, "At least one response is required"),
});

export const flashcardGenerateSchema = z.object({
  noteSetId: z.string().min(1, "Note set id is required"),
  title: z.string().min(3, "Title is too short").max(120).optional(),
  cardCount: z.coerce
    .number()
    .int()
    .min(6, "Ask for at least 6 cards")
    .max(24, "Ask for at most 24 cards")
    .default(12),
});

export const flashcardUpdateSchema = z.object({
  title: z.string().min(3, "Title is too short").max(140, "Keep titles concise").optional(),
  flashcards: z
    .array(
      z.object({
        id: z.string().min(1, "Flashcard id is required").optional(),
        front: z.string().min(1, "Front text is required"),
        back: z.string().min(1, "Back text is required"),
      })
    )
    .min(1, "Include at least one card"),
});

export const templateToggleSchema = z.object({
  isPublicTemplate: z.boolean(),
  description: z.string().max(240, "Keep descriptions short").optional(),
});

export const challengeRequestSchema = z.object({
  expiresInMinutes: z.coerce
    .number()
    .int()
    .min(5, "Challenges must last at least 5 minutes")
    .max(1440, "Limit challenges to 24 hours")
    .optional(),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
export type DocumentImportInput = z.infer<typeof documentImportSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type QuizUpdateInput = z.infer<typeof quizUpdateSchema>;
export type CollaboratorInput = z.infer<typeof collaboratorInputSchema>;
export type FlashcardGenerateInput = z.infer<typeof flashcardGenerateSchema>;
export type FlashcardUpdateInput = z.infer<typeof flashcardUpdateSchema>;
export type TemplateToggleInput = z.infer<typeof templateToggleSchema>;
export type ChallengeRequestInput = z.infer<typeof challengeRequestSchema>;
