import Link from "next/link";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { SignInButtons } from "@/components/sign-in-buttons";
import { env } from "@/lib/env";
import { LinkButton } from "@/components/ui/link-button";

const FEATURE_POINTS = [
  "Transform messy lecture notes into clear prompts",
  "Adaptive quizzes that track confidence, not just scores",
  "Story-like feedback that tells you what to review next",
];

const FEATURE_GRID = [
  {
    title: "Confidence tracking",
    body: "We graph self-reported confidence beside accuracy so you know when to slow down or speed up.",
  },
  {
    title: "Guided reflections",
    body: "Each attempt concludes with a short story-style recap, key insights, and a suggested next activity.",
  },
  {
    title: "Tasteful AI tuning",
    body: "Prompt recipes are tuned for STEM, humanities, and language learning so questions reflect the right tone.",
  },
  {
    title: "Group-friendly (paused)",
    body: "Collaboration links are temporarily disabled while we rebuild the experience with our beta teams.",
  },
];

const WALKTHROUGH_STEPS = [
  {
    title: "Import notes from anywhere",
    body: "Paste raw text, drop a doc, or copy the text from Quizlet’s Export dialog—Quizzr normalizes it all.",
  },
  {
    title: "Generate dynamic quizzes",
    body: "We build multiple-choice and short-answer drills that follow your syllabus tone and pacing.",
  },
  {
    title: "Review with accountable feedback",
    body: "Every attempt ends with narrative guidance, confidence trends, and next-best actions.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Is my data private?",
    answer:
      "Yes. Notes stay in your workspace, encrypted at rest. Collaboration links are paused right now, so nothing leaves your account unless you export it yourself.",
  },
  {
    question: "Does Quizzr replace tutors?",
    answer:
      "No—we focus on accountability between tutor sessions. Use the summaries as conversation starters with humans you trust.",
  },
  {
    question: "Can I export quizzes?",
    answer:
      "Absolutely. Download printable PDFs or push questions into your LMS once you're happy with the edits.",
  },
];

const INTEGRATIONS = [
  { name: "Google Drive", status: "Doc + Slides import" },
  { name: "Notion", status: "Sync reading databases" },
  { name: "Canvas", status: "Assignment linking" },
  { name: "Slack", status: "Study reminders" },
];

const PRIVACY_URL = "/privacy";

const FREE_TIER_POINTS = [
  "Competitors lock AI drills behind $15+/mo plans; Quizzr is free while we test in public.",
  "No credit card or seat minimums—spin up as many quizzes and flashcard decks as you need.",
  "We’ll give at least 60 days notice before introducing any paid tier.",
];

export default async function LandingPage() {
  const session = await auth();
  const emailEnabled = Boolean(env.SMTP_HOST && env.SMTP_FROM);

  return (
    <div className="space-y-16">
      <section className="mt-4 md:mt-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="space-y-6">
            <span className="inline-flex max-w-max items-center gap-2 rounded-full border border-border-subtle/70 bg-bg-soft/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
              Cozy AI study buddy
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-text-main md:text-4xl">
              Quizzr turns sleepy notes into gentle, guided practice.
            </h1>
            <p className="text-base text-text-muted md:text-lg">
              Upload a lecture dump, tap generate, and your personal tutor shows up with calm multiple choice, reflective
              prompts, and progress tracking that actually feels kind.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Built for the Student Hackpad 2025 Hackathon — still free while others upsell
            </p>
            <ul className="space-y-3 text-sm text-text-muted">
              {FEATURE_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-text-muted">
              Most study builders launched paywalls this year; Quizzr is intentionally free for the foreseeable future so you can
              feel the difference before we ever talk pricing.
            </p>
            <div className="pt-2">
              {session?.user ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LinkButton href="/dashboard">Open dashboard</LinkButton>
                  <LinkButton href="/notes/new" variant="secondary">
                    Add fresh notes
                  </LinkButton>
                </div>
              ) : (
                <SignInButtons emailEnabled={emailEnabled} />
              )}
            </div>
          </div>
          <Card className="space-y-5 border-border-subtle/70 bg-gradient-to-br from-bg-soft/90 via-bg-main/95 to-bg-elevated/90 p-6 md:ml-auto md:w-full">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Pricing vibe check</p>
              <h2 className="mt-2 text-2xl font-semibold text-text-main">Free while the giants charge.</h2>
            </div>
            <p className="text-sm text-text-muted">
              Quiz builders like Quizlet+ and Numerade now gate AI practice behind premium seats. Quizzr stays free and ad-free for
              at least the next few semesters while we co-build with students.
            </p>
            <ul className="space-y-3 text-sm text-text-main">
              {FREE_TIER_POINTS.map((point) => (
                <li key={point} className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/70 px-4 py-3">
                  {point}
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-dashed border-accent/60 bg-accent/10 px-4 py-3 text-sm text-accent">
              No credit card required. If pricing ever changes, you’ll get a long heads-up and a student-friendly plan.
            </div>
          </Card>
        </div>
      </section>
      <section className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Why students stay</p>
          <h2 className="text-3xl font-semibold text-text-main">More than flashcards, less than overwhelm</h2>
          <p className="text-base text-text-muted">
            Quizzr balances structure and warmth so self-study feels intentional without the guilt spiral.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURE_GRID.map((feature) => (
            <Card key={feature.title} className="space-y-2 border-border-subtle/70 bg-bg-soft/70 p-5">
              <p className="text-lg font-semibold text-text-main">{feature.title}</p>
              <p className="text-sm text-text-muted">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="grid gap-8 rounded-3xl border border-border-subtle/60 bg-bg-soft/60 p-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">About Quizzr</p>
          <h2 className="text-2xl font-semibold text-text-main">Study buddy built by Alex Radu & friends</h2>
          <p className="text-sm text-text-muted">
            Quizzr is a small, independent app focused on reflective learning. Everything on this page mirrors what you
            described on the OAuth consent screen: students upload notes, we turn them into warm practice sessions, and
            progress data lives in your dashboard—never sold to advertisers.
          </p>
          <div className="inline-flex max-w-max items-center gap-2 rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Built for mindful studying, not ad tech.
          </div>
          <div className="pt-4">
            <Link
              href={PRIVACY_URL}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong"
            >
              Read the Quizzr privacy policy
              <span aria-hidden="true">→</span>
            </Link>
            <p className="mt-2 text-xs text-text-muted">
              This link matches the privacy policy URL configured on the Google OAuth consent screen.
            </p>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-border-subtle/70 bg-bg-elevated/60 p-5 shadow-inner shadow-black/5">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">How it works</p>
          <ol className="space-y-4">
            {WALKTHROUGH_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-main">{step.title}</p>
                  <p className="text-sm text-text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="grid gap-6 rounded-3xl border border-border-subtle/60 bg-bg-soft/70 p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Frequently asked</p>
          <h2 className="text-2xl font-semibold text-text-main">Transparent by design</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-2xl border border-border-subtle/50 bg-bg-elevated/70 p-4">
                <p className="text-sm font-semibold text-text-main">{item.question}</p>
                <p className="text-sm text-text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-border-subtle/70 bg-bg-elevated/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Integrations roadmap</p>
          <ul className="space-y-3">
            {INTEGRATIONS.map((integration) => (
              <li key={integration.name} className="flex items-center justify-between rounded-2xl border border-border-subtle/40 bg-bg-soft/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-main">{integration.name}</p>
                  <p className="text-xs text-text-muted">{integration.status}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-accent"></span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-muted">
            Need something specific? Email <a href="mailto:alex@alexradu.co" className="underline">alex@alexradu.co</a> and we’ll prioritize it with you.
          </p>
        </div>
      </section>
      <section className="rounded-3xl border border-border-subtle/70 bg-gradient-to-r from-accent-soft/60 via-bg-soft/70 to-accent-soft/40 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Ready when you are</p>
        <h2 className="mt-3 text-3xl font-semibold text-text-main">Reclaim gentle study sessions</h2>
        <p className="mx-auto mt-2 max-w-2xl text-text-muted">
          Start by importing one note set. We’ll handle the rest—draft questions, confidence tracking, and reminders that keep you accountable without panic.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href={session?.user ? "/dashboard" : "/api/auth/signin"}>Try Quizzr today</LinkButton>
          <LinkButton href="/notes/new" variant="secondary">
            Build from fresh notes
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
