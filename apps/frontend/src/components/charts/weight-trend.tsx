"use client";

import * as React from "react";
import { formatDateShort } from "@/lib/date";
import { formatKg } from "@/lib/format";

export interface WeightTrendPoint {
  id: string;
  recordedDate: string;
  weightKg: number;
}

interface WeightTrendChartProps {
  logs: WeightTrendPoint[];
  targetWeightKg?: number | null;
  className?: string;
}

export function WeightTrendChart({
  logs,
  targetWeightKg,
  className = "",
}: WeightTrendChartProps) {
  // Urutkan berdasarkan tanggal ascending
  const sorted = React.useMemo(() => {
    return [...logs].sort((a, b) =>
      a.recordedDate.localeCompare(b.recordedDate)
    );
  }, [logs]);

  if (sorted.length === 0) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">
          Belum ada riwayat timbangan.
        </p>
        <p className="mt-1">
          Catat berat pertamamu untuk mulai melihat grafik tren.
        </p>
      </div>
    );
  }

  // Parameter dimensi SVG
  const width = 540;
  const height = 220;
  const padding = { top: 24, right: 32, bottom: 40, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const weights = sorted.map((p) => p.weightKg);
  if (targetWeightKg != null) {
    weights.push(targetWeightKg);
  }

  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const spread = Math.max(rawMax - rawMin, 2);
  const minWeight = Math.floor(rawMin - spread * 0.15);
  const maxWeight = Math.ceil(rawMax + spread * 0.15);
  const weightRange = Math.max(maxWeight - minWeight, 1);

  const getY = (val: number) => {
    const ratio = (val - minWeight) / weightRange;
    return padding.top + plotHeight - ratio * plotHeight;
  };

  const getX = (index: number) => {
    if (sorted.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (sorted.length - 1)) * plotWidth;
  };

  const points = sorted.map((item, idx) => ({
    ...item,
    x: getX(idx),
    y: getY(item.weightKg),
  }));

  // Buat path garis
  const linePath =
    points.length === 1
      ? ""
      : points.reduce(
          (acc, p, idx) =>
            idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          ""
        );

  const areaPath =
    points.length <= 1
      ? ""
      : `${linePath} L ${points[points.length - 1]?.x.toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} L ${points[0]?.x.toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} Z`;

  const targetY = targetWeightKg != null ? getY(targetWeightKg) : null;

  // Garis referensi Y (3 garis)
  const yTicks = [
    minWeight,
    Math.round((minWeight + maxWeight) / 2),
    maxWeight,
  ];

  const firstWeight = sorted[0]?.weightKg ?? 0;
  const lastWeight = sorted[sorted.length - 1]?.weightKg ?? 0;

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full bg-primary" />
            <span className="font-medium text-foreground">Riwayat</span>
          </div>
          {targetWeightKg != null && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-accent" />
              <span>Target ({formatKg(targetWeightKg)})</span>
            </div>
          )}
        </div>
        <span className="tabular-nums">
          Perubahan:{" "}
          <strong className="text-foreground">
            {(lastWeight - firstWeight >= 0 ? "+" : "") +
              (lastWeight - firstWeight).toFixed(1)}{" "}
            kg
          </strong>
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card/60 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label={`Grafik tren berat badan dari ${formatKg(firstWeight)} ke ${formatKg(lastWeight)}`}
        >
          <title>
            {`Tren Berat Badan: dari ${formatKg(firstWeight)} ke ${formatKg(lastWeight)}${
              targetWeightKg ? ` (Target ${formatKg(targetWeightKg)})` : ""
            }`}
          </title>
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {yTicks.map((yVal) => {
            const yPos = getY(yVal);
            return (
              <g key={yVal}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={padding.left + plotWidth}
                  y2={yPos}
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  className="stroke-muted-foreground/15"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {yVal} kg
                </text>
              </g>
            );
          })}

          {/* Garis batas Target (jika ada) */}
          {targetY != null && (
            <g>
              <line
                x1={padding.left}
                y1={targetY}
                x2={padding.left + plotWidth}
                y2={targetY}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="stroke-accent"
              />
              <text
                x={padding.left + plotWidth - 4}
                y={targetY - 5}
                textAnchor="end"
                className="fill-accent text-[10px] font-semibold"
              >
                Target {formatKg(targetWeightKg!)}
              </text>
            </g>
          )}

          {/* Area bayangan di bawah garis */}
          {areaPath && (
            <path d={areaPath} fill="url(#weightAreaGrad)" />
          )}

          {/* Garis tren berat */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-primary"
            />
          )}

          {/* Titik data */}
          {points.map((p) => (
            <g key={p.id} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={points.length === 1 ? 6 : 4.5}
                stroke="currentColor"
                strokeWidth="2"
                className="fill-primary stroke-background transition-transform duration-150 hover:r-6"
              >
                <title>{`${formatDateShort(p.recordedDate)}: ${formatKg(p.weightKg)}`}</title>
              </circle>
            </g>
          ))}

          {/* Sumbu X: Tanggal */}
          {points.map((p, idx) => {
            // Jika ada banyak titik, tampilkan secukupnya agar tidak tumpang tindih
            const shouldShowLabel =
              points.length <= 6 ||
              idx === 0 ||
              idx === points.length - 1 ||
              idx % Math.ceil(points.length / 5) === 0;

            if (!shouldShowLabel) return null;

            return (
              <text
                key={`label-${p.id}`}
                x={p.x}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {formatDateShort(p.recordedDate)}
              </text>
            );
          })}
        </svg>

        {sorted.length === 1 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Catat minimal 2 kali timbangan untuk menampilkan garis tren.
          </p>
        )}
      </div>
    </div>
  );
}
