import * as React from "react";
import { cn } from "@/lib/utils";
import { formatGram } from "@/lib/format";

export type MacroType = "protein" | "carbs" | "fat";

export interface MacroBarProps {
  type: MacroType;
  label?: string;
  consumedG: number;
  targetG: number;
  className?: string;
}

const MACRO_CONFIG: Record<
  MacroType,
  { defaultLabel: string; indicatorClass: string; textClass: string }
> = {
  protein: {
    defaultLabel: "Protein (Bangun Otot)",
    indicatorClass: "bg-macro-protein",
    textClass: "text-macro-protein",
  },
  carbs: {
    defaultLabel: "Karbohidrat (Energi Harian)",
    indicatorClass: "bg-macro-carbs",
    textClass: "text-macro-carbs",
  },
  fat: {
    defaultLabel: "Lemak (Hormon & Sendi)",
    indicatorClass: "bg-macro-fat",
    textClass: "text-macro-fat",
  },
};

export function MacroBar({
  type,
  label,
  consumedG,
  targetG,
  className,
}: MacroBarProps) {
  const cfg = MACRO_CONFIG[type];
  const safeTarget = Math.max(1, targetG);
  const percentage = Math.min(100, Math.round((consumedG / safeTarget) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", cfg.textClass)}>
          {label || cfg.defaultLabel}
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatGram(consumedG, 0)} / {formatGram(targetG, 0)} ({percentage}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={consumedG}
        aria-valuemin={0}
        aria-valuemax={targetG}
        className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className={cn("h-full transition-all duration-300", cfg.indicatorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

