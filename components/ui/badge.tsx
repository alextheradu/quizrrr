import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-strong",
        className
      )}
      {...props}
    />
  );
}
