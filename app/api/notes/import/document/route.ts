import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { documentImportSchema } from "@/lib/validators";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB
const MIN_CONTENT_LENGTH = 60;
const SUPPORTED_EXTENSIONS = new Set(["pdf", "docx", "txt", "md"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const titleValue = formData.get("title");

  if (typeof titleValue !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const parsedTitle = documentImportSchema.safeParse({ title: titleValue });
  if (!parsedTitle.success) {
    return NextResponse.json({ error: "Invalid title", details: parsedTitle.error.flatten() }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please attach a document" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Document is empty" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Document is too large (6 MB max)" }, { status: 413 });
  }

  if (!isSupportedFile(file)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  try {
    const text = await extractTextFromFile(file);
    const normalized = normalizeDocumentText(text);

    if (normalized.length < MIN_CONTENT_LENGTH) {
      return NextResponse.json({ error: "We could not read enough text from that file" }, { status: 422 });
    }

    const noteSet = await prisma.noteSet.create({
      data: {
        userId: session.user.id,
        title: parsedTitle.data.title.trim(),
        rawContent: normalized,
        sourceType: "DOC_UPLOAD",
      },
    });

    return NextResponse.json({ noteSet });
  } catch (error) {
    console.error("Document import failed", error);
    return NextResponse.json({ error: "Could not read that document" }, { status: 422 });
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = getExtension(file.name);
  const mime = file.type;

  if (mime === "application/pdf" || extension === "pdf") {
    const { text } = await pdfParse(buffer);
    return text;
  }

  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  return buffer.toString("utf-8");
}

function normalizeDocumentText(value: string): string {
  const sanitized = value.replace(/\r\n/g, "\n").replaceAll("\u0000", "");
  const lines = sanitized.split("\n").map((line) => line.replace(/\s+/g, " ").trim());
  const reduced: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (reduced.length === 0 || reduced[reduced.length - 1] === "") {
        continue;
      }
      reduced.push("");
    } else {
      reduced.push(line);
    }
  }

  return reduced.join("\n").trim();
}

function isSupportedFile(file: File): boolean {
  const extension = getExtension(file.name);
  if (!extension) {
    return false;
  }
  return SUPPORTED_EXTENSIONS.has(extension);
}

function getExtension(filename: string): string | null {
  const normalized = filename.toLowerCase().trim();
  const parts = normalized.split(".");
  if (parts.length < 2) {
    return null;
  }
  return parts.pop() ?? null;
}
