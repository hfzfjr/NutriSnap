import * as React from "react";
import { CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusPillType =
  | "on_track"
  | "under"
  | "over"
  | "surplus"
  | "deficit"
  | "maintenance";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusPillType;
  label?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  StatusPillType,
  { defaultLabel: string; bgClass: string; textClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  on_track: {
    defaultLabel: "Tepat Sasaran",
    bgClass: "bg-status-ontrack/15 border-status-ontrack/30",
    textClass: "text-status-ontrack font-semibold",
    icon: CheckCircle2,
  },
  under: {
    defaultLabel: "Kurang dari Target",
    bgClass: "bg-status-under/15 border-status-under/30",
    textClass: "text-status-under font-semibold",
    icon: ArrowDownRight,
  },
  over: {
    defaultLabel: "Melebihi Target",
    bgClass: "bg-status-over/15 border-status-over/30",
    textClass: "text-status-over font-semibold",
    icon: ArrowUpRight,
  },
  surplus: {
    defaultLabel: "Surplus Kalori (Bulking)",
    bgClass: "bg-status-ontrack/15 border-status-ontrack/30",
    textClass: "text-status-ontrack font-semibold",
    icon: ArrowUpRight,
  },
  deficit: {
    defaultLabel: "Defisit Kalori (Cutting)",
    bgClass: "bg-status-under/15 border-status-under/30",
    textClass: "text-status-under font-semibold",
    icon: ArrowDownRight,
  },
  maintenance: {
    defaultLabel: "Maintenance",
    bgClass: "bg-secondary border-border",
    textClass: "text-foreground font-semibold",
    icon: Minus,
  },
};

export function StatusPill({
  status,
  label,
  showIcon = true,
  className,
  ...props
}: StatusPillProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.on_track;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border tracking-tight",
        cfg.bgClass,
        cfg.textClass,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{label || cfg.defaultLabel}</span>
    </span>
  );
}
