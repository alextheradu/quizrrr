"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { LoginButton } from "@/components/login-button";
import { signIn } from "next-auth/react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";
import { AUTH_SUCCESS_REDIRECT } from "@/lib/constants";

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const requireAuth = (event: MouseEvent<HTMLAnchorElement>) => {
    if (user) return;
    event.preventDefault();
    setIsMenuOpen(false);
    void signIn("google", { callbackUrl: AUTH_SUCCESS_REDIRECT });
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quizzes", label: "Quizzes" },
    { href: "/notes", label: "Notes" },
    { href: "/flashcards", label: "Flashcards" },
    { href: "/quizzes/templates", label: "Gallery" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle/60 bg-bg-elevated/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex flex-1 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle/70 bg-bg-soft/80 px-4 py-1.5 text-sm font-semibold tracking-tight text-text-main shadow-sm"
          >
            <Image src="/logo-quizzr-2.png" alt="Quizzr logo" width={20} height={20} className="rounded" priority />
            Quizzr
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-text-muted md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={requireAuth}
                aria-disabled={!user}
                className={clsx(
                  "rounded-full px-3 py-1 transition",
                  user ? "text-text-muted hover:bg-bg-soft/60 hover:text-text-main" : "text-text-muted/60"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          {user ? <UserMenu user={user} /> : <LoginButton className="px-4 py-1" />}
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls={panelId}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle/60 bg-bg-soft/70 text-text-main shadow-inner shadow-black/5 transition hover:border-text-main/40 md:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-4 w-5">
              <span
                className={clsx(
                  "absolute left-0 h-0.5 w-full rounded-full bg-text-main transition-all",
                  isMenuOpen ? "top-1/2 rotate-45" : "top-0"
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 h-0.5 w-full rounded-full bg-text-main transition-all",
                  isMenuOpen ? "top-1/2 -translate-y-1/2 opacity-0" : "top-1/2 -translate-y-1/2"
                )}
              />
              <span
                className={clsx(
                  "absolute left-0 h-0.5 w-full rounded-full bg-text-main transition-all",
                  isMenuOpen ? "top-1/2 -rotate-45" : "bottom-0"
                )}
              />
            </span>
          </button>
        </div>
      </div>
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-[#0b0b0d] transition-opacity duration-200 md:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMenu}
      />
      <div
        id={panelId}
        className={clsx(
          "fixed top-4 right-4 left-4 z-40 origin-top rounded-3xl border border-border-subtle bg-bg-main/95 p-5 shadow-2xl shadow-black/40 transition-all duration-200 md:hidden",
          isMenuOpen ? "scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-main">Navigate</p>
          <button
            type="button"
            onClick={closeMenu}
            className="rounded-full border border-border-subtle/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-text-muted"
          >
            Close
          </button>
        </div>
        <nav className="mt-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => {
                requireAuth(event);
                if (user) {
                  closeMenu();
                }
              }}
              aria-disabled={!user}
              className={clsx(
                "rounded-2xl border px-4 py-3 text-sm font-medium shadow-inner shadow-black/5",
                user ? "border-border-subtle bg-bg-soft text-text-main" : "border-border-subtle/50 bg-bg-soft/60 text-text-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 flex flex-col gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <LoginButton className="w-full justify-center rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent" />
          )}
        </div>
      </div>
    </header>
  );
}
