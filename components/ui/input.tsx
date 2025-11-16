import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-2xl border border-border-subtle/70 bg-bg-soft px-4 py-3 text-base text-neutral-900 placeholder:text-text-muted dark:bg-bg-soft dark:text-neutral-50 shadow-inner shadow-black/5 focus:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
