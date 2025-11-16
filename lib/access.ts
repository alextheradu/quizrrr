import { Prisma } from "@prisma/client";

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? undefined;

export function noteAccessFilter(userId: string, email?: string | null): Prisma.NoteSetWhereInput {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { userId };
  }
  return {
    OR: [{ userId }, { collaborators: { some: { collaboratorEmail: normalizedEmail } } }],
  } satisfies Prisma.NoteSetWhereInput;
}

export function quizAccessFilter(userId: string, email?: string | null): Prisma.QuizWhereInput {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { userId };
  }
  return {
    OR: [{ userId }, { noteSet: { collaborators: { some: { collaboratorEmail: normalizedEmail } } } }],
  } satisfies Prisma.QuizWhereInput;
}

export function noteAccessById(id: string, userId: string, email?: string | null): Prisma.NoteSetWhereInput {
  return {
    id,
    ...noteAccessFilter(userId, email),
  } satisfies Prisma.NoteSetWhereInput;
}

export function quizAccessById(id: string, userId: string, email?: string | null): Prisma.QuizWhereInput {
  return {
    id,
    ...quizAccessFilter(userId, email),
  } satisfies Prisma.QuizWhereInput;
}
