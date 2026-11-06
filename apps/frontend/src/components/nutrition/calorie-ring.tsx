"use client";

import * as React from "react";
import { formatNumber } from "@/lib/format";

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
  const size = 196;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeTarget = Math.max(1, targetCalories);
  const progressRatio = Math.min(1.2, Math.max(0, consumedCalories / safeTarget));
  const strokeDashoffset =
    circumference - Math.min(1, progressRatio) * circumference;

  const remaining = targetCalories - consumedCalories;
  const vsTdee = consumedCalories - maintenanceCalories;

  // TDEE Tick mark angle
  const tdeeRatio = Math.min(1, Math.max(0, maintenanceCalories / safeTarget));
  const tdeeAngle = tdeeRatio * 2 * Math.PI; // relative to top (-90deg)
  const center = size / 2;
  const tickInnerR = radius - strokeWidth / 2 - 2;
  const tickOuterR = radius + strokeWidth / 2 + 2;

  // In SVG with -rotate-90, angle 0 is at (cx + r, cy).
  // But since SVG is rotated -90deg, 0 angle in rotated frame starts at top!
  const tickX1 = center + tickInnerR * Math.cos(tdeeAngle);
  const tickY1 = center + tickInnerR * Math.sin(tdeeAngle);
  const tickX2 = center + tickOuterR * Math.cos(tdeeAngle);
  const tickY2 = center + tickOuterR * Math.sin(tdeeAngle);

  // Status color determination
  let progressColorClass = "text-primary";
  if (goalType === "bulking") {
    if (consumedCalories > targetCalories + 300) {
      progressColorClass = "text-status-over";
    } else if (consumedCalories >= maintenanceCalories) {
      progressColorClass = "text-status-ontrack";
    } else {
      progressColorClass = "text-status-under";
    }
  } else if (goalType === "cutting") {
    if (consumedCalories > targetCalories + 150) {
      progressColorClass = "text-status-over";
    } else {
      progressColorClass = "text-status-ontrack";
    }
  }

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
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Active Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${progressColorClass} transition-all duration-700 ease-out`}
        />
        {/* Maintenance / TDEE Indicator Tick */}
        {maintenanceCalories > 0 && (
          <line
            x1={tickX1}
            y1={tickY1}
            x2={tickX2}
            y2={tickY2}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="text-foreground/60"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {remaining >= 0 ? "Sisa Target Hari Ini" : "Kelebihan Kalori"}
        </span>
        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground font-display">
          {formatNumber(Math.abs(remaining))}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          kcal •{" "}
          <strong className="text-foreground">
            {formatNumber(consumedCalories)}
          </strong>{" "}
          / {formatNumber(targetCalories)}
        </span>
        <span className="mt-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-primary tabular-nums border border-border">
          {goalType === "bulking"
            ? vsTdee >= 0
              ? `Surplus +${formatNumber(vsTdee)} kcal dari TDEE`
              : `${formatNumber(Math.abs(vsTdee))} kcal ke TDEE`
            : goalType === "cutting"
            ? vsTdee <= 0
              ? `Defisit ${formatNumber(Math.abs(vsTdee))} kcal dari TDEE`
              : `+${formatNumber(vsTdee)} kcal di atas TDEE`
            : "Maintenance Seimbang"}
        </span>
      </div>
    </div>
  );
}
