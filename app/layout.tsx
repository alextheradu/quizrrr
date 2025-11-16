import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TutorialGuide } from "@/components/tutorial-modal";

export const metadata: Metadata = {
  title: "Quizzr · Cozy AI quizzes",
  description: "Quizzr turns your sleepy notes into warm, adaptive study sessions.",
  icons: {
    icon: "/logo-quizzr-2.png",
    shortcut: "/logo-quizzr-2.png",
    apple: "/logo-quizzr-2.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);
  return (
    <html lang="en" className="bg-bg" suppressHydrationWarning>
      <body className="bg-bg text-text-main antialiased">
        <Providers session={session}>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-accent/20 via-transparent to-transparent blur-[40px]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-accent-soft/40 via-transparent to-transparent blur-[60px]" />
            <SiteHeader user={session?.user ?? null} />
            <main className="page-shell flex-1">{children}</main>
            <SiteFooter />
            <TutorialGuide isSignedIn={isSignedIn} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
