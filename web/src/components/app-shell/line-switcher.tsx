"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { setActiveLine } from "@/app/(app)/line-actions";
import {
  LINE_LABELS_AR,
  PRODUCTION_LINES,
  type ProductionLine,
} from "@/lib/production-line";

/**
 * Two lines, so a segmented control rather than a dropdown: the current line
 * has to be readable at a glance from anywhere in the app, because every number
 * on the screen depends on it.
 */
export function LineSwitcher({ active }: { active: ProductionLine }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-card p-1 shadow-sm"
      role="group"
      aria-label="خط الإنتاج"
    >
      {PRODUCTION_LINES.map((line) => {
        const isActive = line === active;
        return (
          <button
            key={line}
            type="button"
            disabled={pending || isActive}
            aria-pressed={isActive}
            onClick={() => startTransition(() => setActiveLine(line))}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              pending && "opacity-60"
            )}
          >
            {LINE_LABELS_AR[line]}
          </button>
        );
      })}
    </div>
  );
}
