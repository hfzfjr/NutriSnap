"use client";

import * as React from "react";
import { CheckCircle2, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatGram, formatKcal, formatNumber } from "@/lib/format";

interface DemoFoodItem {
  name: string;
  weightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const INITIAL_DEMO_ITEMS: DemoFoodItem[] = [
  {
    name: "Dada Ayam Bakar Bumbu Kuning",
    weightG: 150,
    calories: 248,
    proteinG: 46.5,
    carbsG: 2.1,
    fatG: 5.4,
  },
  {
    name: "Nasi Putih Pulen",
    weightG: 200,
    calories: 260,
    proteinG: 5.4,
    carbsG: 57.2,
    fatG: 0.6,
  },
  {
    name: "Telur Ayam Rebus Utuh",
    weightG: 55,
    calories: 78,
    proteinG: 6.3,
    carbsG: 0.6,
    fatG: 5.3,
  },
];

export function LandingInteractiveDemo() {
  const [items, setItems] = React.useState<DemoFoodItem[]>(INITIAL_DEMO_ITEMS);

  const totalCalories = items.reduce((acc, i) => acc + i.calories, 0);
  const totalProtein = items.reduce((acc, i) => acc + i.proteinG, 0);
  const totalCarbs = items.reduce((acc, i) => acc + i.carbsG, 0);
  const totalFat = items.reduce((acc, i) => acc + i.fatG, 0);

  const handleScaleWeight = (idx: number, newWeight: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const ratio = Math.max(1, newWeight) / item.weightG;
        return {
          ...item,
          weightG: newWeight,
          calories: Math.round(item.calories * ratio),
          proteinG: Math.round(item.proteinG * ratio * 10) / 10,
          carbsG: Math.round(item.carbsG * ratio * 10) / 10,
          fatG: Math.round(item.fatG * ratio * 10) / 10,
        };
      })
    );
  };

  return (
    <section className="py-12 md:py-16 bg-secondary/40 border-y border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="default" className="gap-1 mb-2">
            <Sparkles className="h-3 w-3" />
            Simulasi Interaktif
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Lihat Bagaimana Gemini AI Membaca Makanan Kamu
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hasil deteksi otomatis dapat kamu sesuaikan gramasinya secara
            langsung. Coba ubah gram di bawah untuk melihat makronya
            menyesuaikan seketika.
          </p>
        </div>

        <div className="mt-8">
          <Card className="shadow-lg border-primary/20 overflow-hidden">
            {/* Header Mockup */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Menu Makan Siang Tinggi Protein
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Terdeteksi via AI Scanner • 3 Komponen Makanan
                  </p>
                </div>
              </div>
              <Badge variant="surplus" className="text-xs">
                Target Bulking: Siap Disimpan
              </Badge>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Macro Totals Header */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-2xl bg-secondary/60 p-3.5 text-center">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Total Kalori
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatKcal(totalCalories)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Total Protein
                  </span>
                  <span className="text-lg font-bold tabular-nums text-macro-protein">
                    {formatGram(totalProtein)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Karbohidrat
                  </span>
                  <span className="text-lg font-bold tabular-nums text-macro-carbs">
                    {formatGram(totalCarbs)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Lemak
                  </span>
                  <span className="text-lg font-bold tabular-nums text-macro-fat">
                    {formatGram(totalFat)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-status-ontrack shrink-0" />
                        <span className="text-xs font-semibold text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                        {formatNumber(item.calories)} kcal •{" "}
                        <strong className="text-macro-protein font-semibold">
                          {formatGram(item.proteinG)} Protein
                        </strong>{" "}
                        • {formatGram(item.carbsG)} Karbo •{" "}
                        {formatGram(item.fatG)} Lemak
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Porsi:
                      </span>
                      <div className="flex gap-1">
                        {[100, 150, 200].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleScaleWeight(idx, preset)}
                            className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                              item.weightG === preset
                                ? "bg-primary text-primary-foreground border-primary font-semibold"
                                : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                            }`}
                          >
                            {preset}g
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

