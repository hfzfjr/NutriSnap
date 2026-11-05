"use client";

import * as React from "react";

interface CalorieRingProps {
  consumedCalories: number;
  targetCalories: number;
  maintenanceCalories: number;
  goalType: "bulking" | "cutting" | "maintenance";
}

export function CalorieRing({
  consumedCalories,
  targetCalories,
  maintenanceCalories,
  goalType,
}: CalorieRingProps) {
  const size = 188;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeTarget = Math.max(1, targetCalories);
  const progressRatio = Math.min(1, Math.max(0, consumedCalories / safeTarget));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const remaining = targetCalories - consumedCalories;
  const vsTdee = consumedCalories - maintenanceCalories;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        aria-label="Progress Kalori Harian"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Active Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {remaining >= 0 ? "Sisa Target" : "Melebihi Target"}
        </span>
        <span className="text-3xl font-extrabold tabular-nums tracking-tight">
          {Math.abs(remaining).toLocaleString("id-ID")}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          kcal •{" "}
          <strong className="text-foreground">
            {consumedCalories.toLocaleString("id-ID")}
          </strong>{" "}
          / {targetCalories.toLocaleString("id-ID")}
        </span>
        <span className="mt-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
          {goalType === "bulking"
            ? vsTdee >= 0
              ? `Surplus +${vsTdee} kcal`
              : `${Math.abs(vsTdee)} kcal ke TDEE`
            : goalType === "cutting"
            ? vsTdee <= 0
              ? `Defisit ${vsTdee} kcal`
              : `+${vsTdee} kcal di atas TDEE`
            : "Maintenance Mode"}
        </span>
      </div>
    </div>
  );
}
