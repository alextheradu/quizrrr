"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { GhostButton, SecondaryButton } from "@/components/ui/button";
import Link from "next/link";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nameInitials = user.name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const initials = (nameInitials && nameInitials.trim()) || user.email?.[0]?.toUpperCase() || "?";
  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <GhostButton type="button" onClick={() => setOpen((prev) => !prev)} className="gap-2 px-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
          {initials}
        </span>
        <span className="max-w-[120px] truncate text-sm text-text-muted">{user.name ?? user.email}</span>
      </GhostButton>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border-subtle/60 bg-bg-elevated p-4 shadow-soft/40">
          <div className="mb-3 text-sm">
            <p className="font-semibold text-text-main">{user.name ?? "Welcome"}</p>
            <p className="text-text-muted">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-border-subtle/60 bg-bg-soft px-3 py-2 text-center text-sm text-text-main hover:border-accent hover:text-text-main"
            >
              Dashboard
            </Link>
            <SecondaryButton type="button" onClick={handleSignOut}>
              Sign out
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
