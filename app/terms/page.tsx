import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service · Quizzr",
  description: "Understand the rules for using the Quizzr study platform and AI-powered quizzes.",
};

const UPDATED = "November 15, 2025";

const promises = [
  {
    label: "You own your work",
    detail: "Notes and quizzes stay yours. We only host them so the app can function.",
  },
  {
    label: "No surprise fees",
    detail: "Beta is free. If pricing changes we’ll give advance notice and new terms before charging.",
  },
  {
    label: "Human-level tone",
    detail: "AI helpers can fumble, so we encourage review before sharing or studying.",
  },
];

const responsibilities = [
  "Be 13+ and legally allowed to use the Service.",
  "Keep your Google login secure—we only rely on OAuth.",
  "Upload materials you have rights to—collaboration links are paused for now.",
  "Don’t break the platform, scrape others’ work, or generate abusive content.",
];

const sections = [
  {
    title: "Content & license",
    detail:
      "You retain ownership of anything you upload or generate. You grant us a limited, revocable license to host and process that content solely to operate Quizzr. We may create anonymized statistics that do not identify you.",
  },
  {
    title: "AI assistance",
    detail:
      "Quizzr routes snippets of your notes to vetted AI providers (like OpenRouter) to craft quizzes and flashcards. Outputs may be imperfect—double check before you rely on them.",
  },
  {
    title: "Termination",
    detail:
      "We can suspend or remove access if policies are broken or the platform is at risk. You can leave anytime and request deletion of your data as outlined in the Privacy Policy.",
  },
  {
    title: "Security",
    detail:
      "We apply industry safeguards, but you accept that no system is invincible. Report issues and we’ll investigate quickly.",
  },
];

const guardrails = [
  {
    heading: "Disclaimer",
    text:
      "The Service is provided “as is.” We don’t promise perfect uptime or flawless AI. Use Quizzr at your own academic discretion.",
  },
  {
    heading: "Liability cap",
    text:
      "Our total liability for any claim relating to Quizzr is capped at $50 USD. No consequential or punitive damages.",
  },
  {
    heading: "Indemnification",
    text:
      "You’ll cover costs arising from your misuse of the Service or violation of these Terms, including legal fees.",
  },
  {
    heading: "Governing law",
    text:
      "These Terms follow California law, with disputes handled in San Francisco County courts.",
  },
];

const changeLog = [
  {
    phase: "Plan",
    detail: "We draft updates when features, pricing, or policies evolve.",
  },
  {
    phase: "Notify",
    detail: "Material changes get highlighted in-app or via email before they take effect.",
  },
  {
    phase: "Review",
    detail: "Keep using Quizzr only if the updated Terms feel good to you.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 py-12">
      <section className="rounded-[32px] border border-border-subtle/70 bg-gradient-to-br from-bg-soft via-bg-elevated to-bg-main p-10 shadow-soft/40">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Terms of Service</p>
        <h1 className="mt-3 text-4xl font-semibold text-text-main">The cozy rules of study.</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {UPDATED}</p>
        <p className="mt-6 text-base text-text-muted">
          By using quizzr.app (the “Service”) you agree to these Terms. “We,” “us,” and “our” refer to Alex Radu / Quizzr. If any of this feels off, reach out or simply don’t use the app—no hard feelings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {promises.map((promise) => (
          <Card key={promise.label} className="bg-bg-soft/70">
            <CardTitle>{promise.label}</CardTitle>
            <CardDescription className="mt-2 text-base">{promise.detail}</CardDescription>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <Card className="bg-bg-soft/70">
          <CardTitle>Eligibility & responsibilities</CardTitle>
          <CardDescription className="mt-1">The baseline for sharing a study table.</CardDescription>
          <ul className="mt-4 space-y-3 text-sm text-text-main">
            {responsibilities.map((item) => (
              <li key={item} className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/70 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Acceptable use quick check</CardTitle>
          <CardDescription className="mt-1">Do these and we’re golden.</CardDescription>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-text-main">
            <li>Use generated content responsibly—no harassment or cheating tools.</li>
            <li>Don’t attempt to scrape, overload, or reverse engineer Quizzr.</li>
            <li>Respect other students’ privacy when exporting or discussing content.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription className="mt-2 text-base text-text-main">{section.detail}</CardDescription>
          </Card>
        ))}
      </section>

      <section className="rounded-[28px] border border-border-subtle/60 bg-bg-soft/60 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Hard guardrails</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guardrails.map((item) => (
            <div key={item.heading} className="rounded-3xl border border-border-subtle/50 bg-bg-elevated/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-text-muted">{item.heading}</p>
              <p className="mt-2 text-base text-text-main">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
        <Card>
          <CardTitle>Change log ritual</CardTitle>
          <CardDescription className="mt-1">How new Terms roll out.</CardDescription>
          <ol className="mt-4 space-y-4 text-sm text-text-main">
            {changeLog.map((entry) => (
              <li key={entry.phase} className="rounded-3xl border border-border-subtle/60 bg-bg-elevated/70 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-muted">{entry.phase}</p>
                <p className="mt-2 text-base">{entry.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-text-muted">
            Continuing to use Quizzr after an update means you accept the new Terms.
          </p>
        </Card>

        <Card className="bg-bg-soft/80">
          <CardTitle>Need a human?</CardTitle>
          <CardDescription className="mt-1">We reply fast.</CardDescription>
          <p className="mt-4 text-sm text-text-main">
            Email <Link href="mailto:alex@alexradu.co" className="text-accent">alex@alexradu.co</Link> or mail Alex Radu, 548 Market St PMB 06412, San Francisco, CA 94104. Expect a response within 7 days.
          </p>
        </Card>
      </section>
    </div>
  );
}
