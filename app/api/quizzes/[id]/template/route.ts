import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { templateToggleSchema } from "@/lib/validators";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = templateToggleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.quiz.update({
    where: { id: quiz.id },
    data: {
      isPublicTemplate: parsed.data.isPublicTemplate,
      templateDescription: parsed.data.description ?? null,
    },
    select: { id: true, isPublicTemplate: true, templateDescription: true },
  });

  return NextResponse.json({ template: updated });
}
