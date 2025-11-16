import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const formatDate = (value: Date) => new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(value);

const formatDateNullable = (value?: Date | null) => (value ? formatDate(value) : "No expiry");

const truncate = (value: string, max = 80) => (value.length > max ? `${value.slice(0, max)}...` : value);

type AdminPageProps = {
  searchParams?: {
    entity?: string;
  };
};

type EntityKey =
  | "users"
  | "notes"
  | "quizzes"
  | "attempts"
  | "flashcardSets"
  | "flashcards"
  | "collaborators"
  | "challenges";

type EntityView = {
  title: string;
  description: string;
  columns: string[];
  rows: Array<{ id: string; cells: ReactNode[] }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const adminEmail = env.ADMIN_USER_EMAIL?.toLowerCase();
  if (!adminEmail) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const userEmail = session.user.email.toLowerCase();
  if (userEmail !== adminEmail) {
    notFound();
  }

  const [
    userCount,
    noteSetCount,
    quizCount,
    attemptCount,
    flashcardSetCount,
    flashcardCount,
    collaboratorCount,
    challengeCount,
    latestUsers,
    latestNoteSets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.noteSet.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
    prisma.flashcardSet.count(),
    prisma.flashcard.count(),
    prisma.noteCollaborator.count(),
    prisma.classroomChallenge.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.noteSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { quizzes: true, flashcardSets: true } },
      },
    }),
  ]);

  const summaryCards: Array<{ key: EntityKey; label: string; value: number }> = [
    { key: "users", label: "Total users", value: userCount },
    { key: "notes", label: "Note sets", value: noteSetCount },
    { key: "quizzes", label: "Quizzes", value: quizCount },
    { key: "attempts", label: "Quiz attempts", value: attemptCount },
    { key: "flashcardSets", label: "Flashcard sets", value: flashcardSetCount },
    { key: "flashcards", label: "Flashcards", value: flashcardCount },
    { key: "collaborators", label: "Collaborators", value: collaboratorCount },
    { key: "challenges", label: "Active challenges", value: challengeCount },
  ];

  const rawEntity = searchParams?.entity ?? "";
  const validEntityKeys: readonly EntityKey[] = [
    "users",
    "notes",
    "quizzes",
    "attempts",
    "flashcardSets",
    "flashcards",
    "collaborators",
    "challenges",
  ];
  const isEntityKey = (value: string): value is EntityKey => (validEntityKeys as readonly string[]).includes(value);
  const activeEntityKey = isEntityKey(rawEntity) ? rawEntity : null;

  let entityView: EntityView | null = null;

  if (activeEntityKey) {
    switch (activeEntityKey) {
      case "users": {
        const rows = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, createdAt: true },
        });
        entityView = {
          title: "All users",
          description: "Full roster of registered accounts.",
          columns: ["Name", "Email", "Joined"],
          rows: rows.map((user) => ({
            id: user.id,
            cells: [user.name ?? "Unnamed", user.email, formatDate(user.createdAt)],
          })),
        };
        break;
      }
      case "notes": {
        const rows = await prisma.noteSet.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        });
        entityView = {
          title: "All note sets",
          description: "Every uploaded or generated knowledge base.",
          columns: ["Title", "Owner", "Created"],
          rows: rows.map((note) => ({
            id: note.id,
            cells: [note.title, note.user?.name ?? note.user?.email ?? "Unknown", formatDate(note.createdAt)],
          })),
        };
        break;
      }
      case "quizzes": {
        const rows = await prisma.quiz.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            noteSet: { select: { title: true } },
          },
        });
        entityView = {
          title: "All quizzes",
          description: "Comprehensive list of generated quizzes.",
          columns: ["Title", "Owner", "Source note", "Created"],
          rows: rows.map((quiz) => ({
            id: quiz.id,
            cells: [
              quiz.title,
              quiz.user?.name ?? quiz.user?.email ?? "Unknown",
              quiz.noteSet?.title ?? "Missing",
              formatDate(quiz.createdAt),
            ],
          })),
        };
        break;
      }
      case "attempts": {
        const rows = await prisma.quizAttempt.findMany({
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            score: true,
            quiz: { select: { title: true } },
            user: { select: { name: true, email: true } },
          },
        });
        entityView = {
          title: "All quiz attempts",
          description: "Assessment history for every learner.",
          columns: ["Quiz", "Learner", "Score", "Started", "Completed"],
          rows: rows.map((attempt) => ({
            id: attempt.id,
            cells: [
              attempt.quiz?.title ?? "Untitled quiz",
              attempt.user?.name ?? attempt.user?.email ?? "Unknown",
              attempt.score === null || attempt.score === undefined ? "Pending" : attempt.score.toFixed(2),
              formatDate(attempt.startedAt),
              attempt.completedAt ? formatDate(attempt.completedAt) : "In progress",
            ],
          })),
        };
        break;
      }
      case "flashcardSets": {
        const rows = await prisma.flashcardSet.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
            noteSet: { select: { title: true } },
          },
        });
        entityView = {
          title: "All flashcard sets",
          description: "Collections of study cards, including owners.",
          columns: ["Title", "Owner", "Linked note", "Created"],
          rows: rows.map((set) => ({
            id: set.id,
            cells: [
              set.title,
              set.user?.name ?? set.user?.email ?? "Unknown",
              set.noteSet?.title ?? "Detached",
              formatDate(set.createdAt),
            ],
          })),
        };
        break;
      }
      case "flashcards": {
        const rows = await prisma.flashcard.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            front: true,
            back: true,
            createdAt: true,
            flashcardSet: { select: { title: true } },
          },
        });
        entityView = {
          title: "All flashcards",
          description: "Individual cards for review sessions.",
          columns: ["Prompt", "Answer", "Set", "Created"],
          rows: rows.map((card) => ({
            id: card.id,
            cells: [
              truncate(card.front, 60),
              truncate(card.back, 60),
              card.flashcardSet?.title ?? "Unknown set",
              formatDate(card.createdAt),
            ],
          })),
        };
        break;
      }
      case "collaborators": {
        const rows = await prisma.noteCollaborator.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            collaboratorEmail: true,
            createdAt: true,
            noteSet: { select: { title: true } },
          },
        });
        entityView = {
          title: "All collaborators",
          description: "Shared access across notebooks.",
          columns: ["Note", "Collaborator email", "Added"],
          rows: rows.map((collab) => ({
            id: collab.id,
            cells: [
              collab.noteSet?.title ?? "Unknown note",
              collab.collaboratorEmail,
              formatDate(collab.createdAt),
            ],
          })),
        };
        break;
      }
      case "challenges": {
        const rows = await prisma.classroomChallenge.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            token: true,
            expiresAt: true,
            createdAt: true,
            quiz: { select: { title: true } },
          },
        });
        entityView = {
          title: "All challenges",
          description: "Open classroom challenge links.",
          columns: ["Quiz", "Token", "Expires", "Created"],
          rows: rows.map((challenge) => ({
            id: challenge.id,
            cells: [
              challenge.quiz?.title ?? "Unknown quiz",
              challenge.token,
              formatDateNullable(challenge.expiresAt),
              formatDate(challenge.createdAt),
            ],
          })),
        };
        break;
      }
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Admin console</p>
        <h1 className="text-3xl font-semibold text-text-main">Team health metrics</h1>
        <p className="text-text-muted">Only {adminEmail} can see this page.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const isActive = activeEntityKey === card.key;
          const href = `/admin?entity=${card.key}`;
          return (
            <Link
              key={card.label}
              href={href}
              prefetch={false}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
            >
              <Card
                className={`border-border-subtle/70 bg-bg-soft/70 p-5 transition ${
                  isActive ? "border-accent" : "hover:-translate-y-0.5 hover:border-accent/70"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-text-main">{card.value.toLocaleString()}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      {entityView ? (
        <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{entityView.title}</CardTitle>
              <CardDescription className="mt-1">{entityView.description}</CardDescription>
            </div>
            <Link
              href="/admin"
              prefetch={false}
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Back to overview
            </Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.25em] text-text-muted">
                  {entityView.columns.map((column) => (
                    <th key={column} className="pb-3 pr-4 font-semibold last:pr-0">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entityView.rows.length === 0 ? (
                  <tr>
                    <td colSpan={entityView.columns.length} className="py-6 text-center text-text-muted">
                      No records yet.
                    </td>
                  </tr>
                ) : (
                  entityView.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle/30 text-text-main last:border-none"
                    >
                      {row.cells.map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-3 pr-4 align-top text-sm last:pr-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
            <CardTitle>Latest users</CardTitle>
            <CardDescription className="mt-1">Five most recent accounts.</CardDescription>
            <ul className="mt-4 space-y-3 text-sm text-text-main">
              {latestUsers.map((user) => (
                <li key={user.id} className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/70 px-4 py-3">
                  <p className="font-semibold">{user.name ?? "Unnamed"}</p>
                  <p className="text-xs text-text-muted">{user.email ?? "No email"}</p>
                  <p className="text-xs text-text-muted">Joined {formatDate(user.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-border-subtle/70 bg-bg-soft/80 p-6">
            <CardTitle>Latest note sets</CardTitle>
            <CardDescription className="mt-1">Track content creation velocity.</CardDescription>
            <ul className="mt-4 space-y-3 text-sm text-text-main">
              {latestNoteSets.map((note) => (
                <li key={note.id} className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/70 px-4 py-3">
                  <p className="font-semibold">{note.title}</p>
                  <p className="text-xs text-text-muted">
                    Owner {note.user?.name ?? note.user?.email ?? "Unknown"} · {formatDate(note.createdAt)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {note._count.quizzes} quizzes · {note._count.flashcardSets} flashcard sets
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
