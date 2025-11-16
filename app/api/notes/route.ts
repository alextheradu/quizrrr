import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { noteInputSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = noteInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const noteSet = await prisma.noteSet.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      rawContent: parsed.data.rawContent,
      sourceType: parsed.data.sourceType,
    },
  });

  return NextResponse.json({ noteSet });
}
