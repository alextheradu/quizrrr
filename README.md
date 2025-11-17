# Quizzr

Quizzr is the cozy AI study buddy built for the Student Hackpad 2025 Hackathon ([submission](https://devpost.com/software/quizzr-prsxik)). It turns sleepy, unstructured notes into gentle
quizzes, reflective flashcards, and story-like feedback—free while bigger platforms upsell access.

## Why it exists

- **Hackathon roots.** Crafted for Student Hackpad 2025 to prove AI study tools can be transparent, and affordable.
- **Free while we co-build.** Competitors lock AI drills behind $15+/mo plans; Quizzr stays free and ad-free while we gather        feedback from students in out public beta. 
- **Trust-first design.** Privacy, OAuth disclosures, and the landing page all emphasize data staying in your workspace, never sold
	to ad tech.

## Highlights

- 📝 Import notes from anywhere: paste raw text, upload docs, or drop Quizlet exports.
- 🤖 OpenRouter-powered quiz generation with per-type controls (multiple choice vs. short answer) and mixed difficulty.
- 📊 Confidence tracking overlays: graph self-reported confidence next to accuracy so you know when to slow down.
- 📚 Guided reflections: every quiz run ends with narrative summaries, next steps, and accountability tips.
- 🃏 Flashcards and study view: generate decks, flip cards, and now manually tweak cards through the editor modal.
- 🔐 Auth via Google OAuth + passwordless email, with NextAuth managing sessions.
- 📴 Collaboration links & classroom challenges are paused while the beta team helps rebuild the experience.

## Requirements

- Node.js 20+
- npm 10+
- Docker (PostgreSQL 16 via `docker-compose`)

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

Visit `http://localhost:3000` and sign in with Google or email to reach the dashboard.

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

Check `.env.example` for the full list. Keep secrets local.

- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` – AI quiz + feedback generation
- `SMTP_*` – email magic links for NextAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – OAuth provider
- `NEXTAUTH_SECRET` – session encryption
- `NEXTAUTH_URL` – public site origin (e.g. `https://quizzr.org`)
- `AUTH_URL` – NextAuth endpoint on the same origin (e.g. `https://quizzr.org/api/auth`)

### Importing flashcards from Quizlet

Quizzr no longer scrapes Quizlet URLs. Instead:

1. Open the Quizlet set and click **Export**.
2. Keep the output as plain text and copy the generated terms/definitions.
3. Paste that text into the “Paste notes” field in Quizzr; each row becomes editable content you can tag before generating
	 quizzes or flashcards.

## Project structure

```
app/            # Next.js App Router routes and pages
components/     # Reusable UI pieces (forms, modals, buttons)
lib/            # Utilities (Prisma, OpenRouter, auth helpers)
prisma/         # Schema, migrations, seed script
public/         # Static assets
```

## Database

- PostgreSQL via `docker-compose.yml` (image `postgres:16`)
- Default connection: `postgresql://postgres:postgres@localhost:5432/quiz_app?schema=public`

## Testing the AI flow

1. Create a note set with pasted text or an imported document.
2. Click **Generate quiz**, pick a question mix, and let OpenRouter draft prompts.
3. Take the quiz, submit answers, and read the narrative feedback.
4. Optionally generate flashcards from the same notes and study in the flip-view.

## How We Built It

- Frontend: Next.js App Router with TypeScript, React Server Components, Tailwind CSS, and Radix-inspired UI primitives.
- Backend: Node.js 20 on Vercel/Next runtime with NextAuth, custom API routes, and OpenRouter for AI generation.
- Database: PostgreSQL (Docker/Postgres 16) orchestrated through Prisma ORM.
- Tooling: ESLint + TypeScript for safety, Turbo dev server, and OpenRouter SDK-free REST calls.

## Built with ❤️ for Student Hackpad 2025

Quizzr was pitched live during Student Hackpad’s 2025 finals to show that mindful AI tutoring can stay calm, transparent, and
accessible. If you’re building with us—or want to bring Quizzr into your campus pilot—email alex@alexradu.co.
