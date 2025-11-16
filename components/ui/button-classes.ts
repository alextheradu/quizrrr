import { clsx } from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export const buttonBaseClasses =
  "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60 md:px-6";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-accent-strong via-accent to-accent-strong text-white shadow-[0_20px_45px_rgba(18,80,194,0.35)] hover:-translate-y-0.5 hover:shadow-[0_25px_60px_rgba(18,80,194,0.45)]",
  secondary:
    "relative overflow-visible border border-border-subtle/70 bg-bg-soft text-text-main shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:bg-bg-elevated after:pointer-events-none after:absolute after:inset-x-4 after:-bottom-1.5 after:h-1 after:rounded-full after:bg-border-subtle/60 after:opacity-0 after:content-[''] after:transition-all after:duration-200 hover:after:opacity-100",
  ghost: "text-text-muted hover:bg-bg-soft/70 hover:text-text-main",
  danger:
    "border border-transparent bg-red-600 text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)] hover:-translate-y-0.5 hover:bg-red-500 focus-visible:ring-red-300",
};

export function buttonClassNames(variant: ButtonVariant = "primary", className?: string) {
  return clsx(buttonBaseClasses, buttonVariantClasses[variant], className);
}
