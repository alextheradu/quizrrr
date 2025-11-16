import Link from "next/link";

const YEAR = new Date().getFullYear();

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:alex@alexradu.co", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border-subtle/50 bg-bg-soft/30 px-4 py-10 text-sm text-text-muted md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-text-main">Quizzr</p>
          <p className="text-xs uppercase tracking-[0.35em]">Study better</p>
          <p className="mt-2 text-xs">© {YEAR} Alex Radu. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-text-main/80">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 font-medium text-text-main/80 hover:bg-bg-elevated/60 hover:text-text-main">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
