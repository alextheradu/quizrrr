# Notle

Notle turns messy student notes into cozy, confidence-building quizzes powered by OpenRouter.

## Requirements

- Node.js 20+
- npm 10+
- Docker (for PostgreSQL)

## Features

- 📝 Paste or upload notes, organized per student account.
- 🤖 OpenRouter-powered quiz generation with mixed difficulties and formats.
- 🧠 Personalized AI feedback with confidence-aware summaries and study roadmaps.
- 👯 Collaboration links are temporarily paused while we revamp the experience.
- 🏫 Classroom challenges are also paused during the same maintenance window.
- 🃏 Generate bite-sized flashcards from notes with a dedicated study view.
- 🔐 Authentication via Google OAuth and email magic links (SMTP).
- 🎨 Cozy Claude-inspired theme with light/dark mode toggle and Tailwind components.

## Quick start

```bash
npm install
cp .env.example .env
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Apply Prisma migrations

```bash
npx prisma migrate dev
```

### Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Scripts

- `npm run dev` – Next.js dev server with Turbo
- `npm run build` – Production build
- `npm run start` – Run production server
- `npm run lint` – ESLint via `next lint`
- `npm run prisma:migrate` – `prisma migrate dev`
- `npm run prisma:studio` – inspect data via Prisma Studio
- `npm run prisma:generate` – regenerate Prisma Client
- `npm run prisma:seed` – run the seed script

## Environment variables

See `.env.example` for the full list. Never commit real secrets.

Key values:

- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` for quiz + feedback generation.
- `SMTP_*` for the NextAuth email provider.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for OAuth.
- `NEXTAUTH_SECRET` for secure session encryption.
- `NEXTAUTH_URL` should match the public site origin (e.g., `https://quizzr.alexradu.co`).
- `AUTH_URL` must point to the auth endpoint on that same origin (e.g., `https://quizzr.alexradu.co/api/auth`). Use `http://localhost:3000` plus `/api/auth` while developing locally so callbacks stay on your tunnel/host file.

### Importing sets from Quizlet

Quizrrr no longer tries to fetch Quizlet links directly (free proxies rarely work and often violate their terms). Instead, use
Quizlet’s built-in export feature:

1. Open the Quizlet set and click **Export**.
2. Leave the format as plain text (or “Text” in their UI) and copy the generated terms/definitions.
3. Paste that text into the “Paste notes” field in Quizzrrr. Each term/definition pair becomes editable content you can clean up or
	tag before generating quizzes.

## Project structure

```
app/            # Next.js App Router routes
components/     # Reusable UI pieces
lib/            # Utilities (Prisma, OpenRouter, auth helpers)
prisma/         # Schema, migrations, seed script
```

## Database

- PostgreSQL via `docker-compose.yml` (image `postgres:16`)
- Default database URL: `postgresql://postgres:postgres@localhost:5432/quiz_app?schema=public`

## Testing the AI flow

1. Create a note set with pasted text.
2. Click **Generate quiz** to call OpenRouter (requires valid API key and model name).
3. Take the quiz and submit answers to receive AI-authored study feedback.
4. Optional: Use **Generate flashcards** on the same note set to create a deck for quick review.
