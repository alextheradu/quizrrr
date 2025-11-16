import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy · Quizzr",
  description: "Understand what data Quizzr collects, how Google OAuth information is used, and how to manage your privacy.",
};

const UPDATED = "November 15, 2025";

const quickFacts = [
  {
    title: "Google OAuth only",
    detail: "We request your name, email, and avatar—never your inbox or docs.",
  },
  {
    title: "Your notes, your rules",
    detail: "Nothing is shared externally right now—collaboration links are paused while we harden the experience.",
  },
  {
    title: "No ad tech",
    detail: "We do not sell data, run ads, or embed tracking pixels.",
  },
  {
    title: "7-day response",
    detail: "Data requests are answered within a week at alex@alexradu.co.",
  },
];

const processors = [
  { name: "Google OAuth", note: "Sign-in and account protection." },
  { name: "Supabase Postgres + Prisma", note: "Primary database + ORM." },
  { name: "OpenRouter", note: "Generates quizzes and flashcards from your notes." },
  { name: "Vercel / PM2", note: "Application hosting, logs, metrics." },
  { name: "Nodemailer / email provider", note: "Account and support emails." },
];

const rights = [
  "Request a portable copy of your data.",
  "Ask us to delete your account and generated content.",
  "Export or delete your study data at any time.",
  "Report security issues or privacy concerns without penalty.",
];

const dataFlow = [
  {
    phase: "Collect",
    detail: "Notes you import, quiz attempts, and OAuth basics land in our encrypted database.",
  },
  {
    phase: "Process",
    detail: "OpenRouter receives the relevant note excerpt to craft quiz questions or flashcards. Outputs save back to your workspace.",
  },
  {
    phase: "Review",
    detail: "You can revisit, regenerate, or delete content directly in your workspace.",
  },
  {
    phase: "Delete",
    detail: "Email us to purge everything. Production rows disappear within 30 days; backups roll off within 35 days.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 py-12">
      <section className="rounded-[32px] border border-border-subtle/60 bg-gradient-to-br from-bg-soft via-bg-elevated to-bg-main p-10 shadow-soft/40">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Privacy Policy</p>
        <h1 className="mt-3 text-4xl font-semibold text-text-main">Your data, your study buddy.</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {UPDATED}</p>
        <p className="mt-6 text-base text-text-muted">
          Quizzr is operated by Alex Radu (“we,” “us,” or “our”). This notice explains what information we collect when you use
          quizzr.app, why we collect it, and the choices you have. We follow the Google API Services User Data Policy, including the
          Limited Use requirements, for any information received via Google OAuth.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickFacts.map((fact) => (
          <Card key={fact.title} className="bg-bg-soft/80">
            <CardTitle>{fact.title}</CardTitle>
            <CardDescription className="mt-2 text-base">{fact.detail}</CardDescription>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
        <Card className="bg-bg-soft/70">
          <CardTitle>Information we collect</CardTitle>
          <CardDescription className="mt-1">Grouped by purpose so you can skim quickly.</CardDescription>
          <dl className="mt-6 space-y-5 text-sm text-text-muted">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Account data</dt>
              <dd className="mt-1 text-base text-text-main">
                Google-provided name, email, and avatar strictly for authentication. We cannot access your password or Gmail.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Study content</dt>
              <dd className="mt-1 text-base text-text-main">
                Notes you paste or upload, generated quizzes, flashcards, attempts, and feedback entries.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Usage telemetry</dt>
              <dd className="mt-1 text-base text-text-main">
                IP, browser/OS, timestamps, feature interactions, and crash logs to keep Quizzr healthy. No ad IDs, no cross-site tracking.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Support threads</dt>
              <dd className="mt-1 text-base text-text-main">Emails or forms you send our team for help.</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle>How we use it</CardTitle>
          <CardDescription className="mt-1">Only the essentials.</CardDescription>
          <ul className="mt-4 space-y-3 text-sm text-text-main">
            <li className="rounded-2xl border border-border-subtle/50 bg-bg-elevated/70 px-4 py-3">
              Authenticate you with Google OAuth and guard against suspicious logins.
            </li>
            <li className="rounded-2xl border border-border-subtle/50 bg-bg-elevated/70 px-4 py-3">
              Generate quizzes, flashcards, and study analytics (collaboration is temporarily paused).
            </li>
            <li className="rounded-2xl border border-border-subtle/50 bg-bg-elevated/70 px-4 py-3">
              Maintain reliability—debug issues, enforce rate limits, and comply with legal obligations.
            </li>
            <li className="rounded-2xl border border-border-subtle/50 bg-bg-elevated/70 px-4 py-3">
              Send essential notifications (security, feature updates) or support replies.
            </li>
          </ul>
          <p className="mt-4 text-sm text-text-muted">
            Information from Google APIs is only used to provide or improve sign-in, per Google’s Limited Use policy. No ads, no selling, no human review unless you ask for support.
          </p>
        </Card>
      </section>

      <section className="rounded-[28px] border border-border-subtle/60 bg-bg-soft/60 p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Data lifecycle</p>
        <ol className="mt-4 space-y-6">
          {dataFlow.map((item) => (
            <li key={item.phase} className="rounded-3xl border border-border-subtle/50 bg-bg-elevated/70 px-6 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-text-muted">{item.phase}</p>
              <p className="mt-2 text-base text-text-main">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Sharing & processors</CardTitle>
          <CardDescription className="mt-1">Only a handful of providers touch your data.</CardDescription>
          <ul className="mt-4 space-y-3 text-sm text-text-main">
            {processors.map((processor) => (
              <li key={processor.name} className="rounded-2xl border border-border-subtle/60 bg-bg-soft/80 px-4 py-3">
                <p className="font-semibold text-text-main">{processor.name}</p>
                <p className="text-xs text-text-muted">{processor.note}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Your choices & rights</CardTitle>
          <CardDescription className="mt-1">You stay in control.</CardDescription>
          <ul className="mt-4 space-y-3 text-sm text-text-main">
            {rights.map((item) => (
              <li key={item} className="rounded-2xl border border-border-subtle/60 bg-bg-elevated/80 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-text-muted">
            Email <Link href="mailto:alex@alexradu.co" className="text-accent">alex@alexradu.co</Link> and we’ll respond within 7 days.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-bg-soft/80">
          <CardTitle>Security</CardTitle>
          <CardDescription className="mt-1">Boring but important.</CardDescription>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-text-main">
            <li>HTTPS everywhere and managed-at-rest encryption.</li>
            <li>Access limited to the operations team with least-privilege permissions.</li>
            <li>Automated monitoring for abuse plus manual review when needed.</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Retention & kids</CardTitle>
          <CardDescription className="mt-1">How long we keep things and who the product is for.</CardDescription>
          <p className="mt-4 text-sm text-text-main">
            Content sticks around while you keep an account so you can revisit study trails. Ask us to delete it and we’ll remove production data within 30 days, backups within 35 days unless law says otherwise.
          </p>
          <p className="mt-4 text-sm text-text-main">
            Quizzr is not for children under 13 and we don’t knowingly collect data from them. Tell us if we should remove something.
          </p>
        </Card>
      </section>

      <section className="rounded-[28px] border border-border-subtle/60 bg-bg-elevated/70 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-text-muted">Need help?</p>
        <h2 className="mt-3 text-2xl font-semibold text-text-main">Privacy questions, audits, deletion requests</h2>
        <p className="mt-4 text-base text-text-muted">
          Email <Link href="mailto:alex@alexradu.co" className="text-accent">alex@alexradu.co</Link>.
        </p>
      </section>
    </div>
  );
}
