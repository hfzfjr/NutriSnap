import * as React from "react";
import { Dumbbell, Flame, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export type GoalType = "bulking" | "cutting" | "maintenance";

export interface GoalChipProps {
  goal: GoalType;
  selected?: boolean;
  onClick?: () => void;
  description?: string;
  className?: string;
}

const GOAL_META: Record<
  GoalType,
  { label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  bulking: {
    label: "Bulking (Surplus)",
    sublabel: "Bangun massa otot & naik berat badan",
    icon: Dumbbell,
  },
  cutting: {
    label: "Cutting (Defisit)",
    sublabel: "Pangkas lemak tubuh terjadwal",
    icon: Flame,
  },
  maintenance: {
    label: "Maintenance (Seimbang)",
    sublabel: "Pertahankan berat badan stabil",
    icon: Scale,
  },
};

export function GoalChip({
  goal,
  selected = false,
  onClick,
  description,
  className,
}: GoalChipProps) {
  const meta = GOAL_META[goal];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-start gap-3 rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
          : "border-border bg-card hover:bg-secondary/60",
        className
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{meta.label}</p>
        <p className="text-xs text-muted-foreground">{description || meta.sublabel}</p>
      </div>
    </button>
  );
}
