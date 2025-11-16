import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const noteSet = await prisma.noteSet.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!noteSet) {
    return NextResponse.json({ error: "Note set not found" }, { status: 404 });
  }

  await prisma.noteSet.delete({ where: { id: noteSet.id } });
  return NextResponse.json({ success: true });
}
