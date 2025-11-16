"use client";

import { clsx } from "clsx";
import { useTheme, type ThemeMode } from "@/components/theme-provider";

const OPTIONS: Array<{ label: string; value: ThemeMode }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="inline-flex items-center rounded-full border border-border-subtle bg-bg-soft/80 p-1 text-xs shadow-sm md:text-sm">
      {OPTIONS.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => setMode(option.value)}
            className={clsx(
              "rounded-full px-3 py-1 font-medium transition-colors",
              isActive ? "bg-bg-elevated text-text-main shadow-soft/40" : "text-text-muted hover:text-text-main"
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
