"use client";

import * as React from "react";
import type { ActivityLevel, Gender } from "@nutrisnap/shared";
import { calculateNutritionPlan } from "@nutrisnap/shared";
import { ArrowRight, Calculator, Check, Dumbbell, Flame, Scale } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatBmiCategory, formatGram, formatKcal, formatNumber } from "@/lib/format";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Jarang Bergerak", desc: "Bekerja di meja, tanpa olahraga rutin" },
  { value: "light", label: "Aktivitas Ringan", desc: "Olahraga 1–3 hari/minggu" },
  { value: "moderate", label: "Aktivitas Sedang", desc: "Olahraga 3–5 hari/minggu" },
  { value: "active", label: "Sangat Aktif", desc: "Latihan berat 6–7 hari/minggu" },
  { value: "very_active", label: "Atlet / Fisik Berat", desc: "Latihan 2x sehari atau pekerjaan fisik berat" },
];

export function LandingQuickCalculator() {
  const [gender, setGender] = React.useState<Gender>("male");
  const [age, setAge] = React.useState<number>(24);
  const [heightCm, setHeightCm] = React.useState<number>(172);
  const [currentWeightKg, setCurrentWeightKg] = React.useState<number>(60);
  const [targetWeightKg, setTargetWeightKg] = React.useState<number>(68);
  const [targetTimelineMonths, setTargetTimelineMonths] = React.useState<number>(5);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>("moderate");

  const plan = React.useMemo(() => {
    return calculateNutritionPlan({
      gender,
      age: Math.max(12, age || 24),
      heightCm: Math.max(80, heightCm || 170),
      currentWeightKg: Math.max(30, currentWeightKg || 60),
      targetWeightKg: Math.max(30, targetWeightKg || 65),
      targetTimelineMonths: Math.max(1, targetTimelineMonths || 3),
      activityLevel,
    });
  }, [gender, age, heightCm, currentWeightKg, targetWeightKg, targetTimelineMonths, activityLevel]);

  return (
    <section id="calculator" className="py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="default" className="gap-1 mb-2">
            <Calculator className="h-3 w-3" />
            Kalkulator Terbuka
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Hitung Kebutuhan Kalori & Protein Kamu Sekarang
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Berdasarkan rumus ilmiah Mifflin-St Jeor dan rekomendasi makro
            terpersonalisasi untuk komposisi tubuh ideal.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Form Input */}
          <Card className="lg:col-span-7 border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                Parameter Profil Fisik
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Gender Toggle */}
              <Field label="Jenis Kelamin">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={gender === "male" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("male")}
                    className="h-10 text-xs"
                  >
                    Pria
                  </Button>
                  <Button
                    type="button"
                    variant={gender === "female" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("female")}
                    className="h-10 text-xs"
                  >
                    Wanita
                  </Button>
                </div>
              </Field>

              {/* Usia, TB, BB */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Usia (Thn)">
                  <Input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                </Field>
                <Field label="Tinggi (cm)">
                  <Input
                    type="number"
                    min={80}
                    max={250}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                  />
                </Field>
                <Field label="Berat (kg)">
                  <Input
                    type="number"
                    step="0.5"
                    min={30}
                    max={300}
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  />
                </Field>
              </div>

              {/* Target BB & Durasi */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Target Berat (kg)">
                  <Input
                    type="number"
                    step="0.5"
                    min={30}
                    max={300}
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  />
                </Field>
                <Field label="Target Durasi (Bulan)">
                  <Input
                    type="number"
                    min={1}
                    max={36}
                    value={targetTimelineMonths}
                    onChange={(e) => setTargetTimelineMonths(Number(e.target.value))}
                  />
                </Field>
              </div>

              {/* Aktivitas Harian */}
              <Field label="Tingkat Aktivitas Harian">
                <div className="space-y-1.5">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityLevel(opt.value)}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors ${
                        activityLevel === opt.value
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                      </div>
                      {activityLevel === opt.value && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="lg:col-span-5 border-primary/30 bg-card shadow-lg sticky top-20">
            <CardHeader className="pb-3 border-b border-border bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Rencana Nutrisi Pribadi
                </CardTitle>
                <Badge
                  variant={
                    plan.goalType === "bulking"
                      ? "surplus"
                      : plan.goalType === "cutting"
                      ? "deficit"
                      : "maintenance"
                  }
                  className="uppercase text-xs"
                >
                  {plan.goalType}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* BMI & TDEE */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-secondary/60 p-2.5">
                  <span className="text-[10px] text-muted-foreground block">
                    Skor BMI Kamu
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {plan.bmiScore}
                  </span>
                  <span className="text-[10px] text-primary block font-medium">
                    {formatBmiCategory(plan.bmiCategory)}
                  </span>
                </div>
                <div className="rounded-xl bg-secondary/60 p-2.5">
                  <span className="text-[10px] text-muted-foreground block">
                    Maintenance TDEE
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {formatNumber(plan.maintenanceCalories)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    kcal / hari
                  </span>
                </div>
              </div>

              {/* Target Calories Big Box */}
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                  Target Kalori Harian
                </span>
                <span className="text-3xl font-extrabold tabular-nums text-foreground font-display">
                  {formatKcal(plan.targetDailyCalories)}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.goalType === "bulking"
                    ? `Surplus +${formatNumber(plan.dailyCalorieDelta)} kcal dari TDEE`
                    : plan.goalType === "cutting"
                    ? `Defisit ${formatNumber(plan.dailyCalorieDelta)} kcal dari TDEE`
                    : "Menjaga berat badan stabil"}
                </p>
              </div>

              {/* Macros Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-macro-protein" />
                    <span className="font-medium">Target Protein</span>
                  </div>
                  <span className="font-bold tabular-nums text-macro-protein">
                    {formatGram(plan.targetDailyProteinG)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-macro-carbs" />
                    <span className="font-medium">Target Karbohidrat</span>
                  </div>
                  <span className="font-bold tabular-nums text-macro-carbs">
                    {formatGram(plan.targetDailyCarbsG)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-macro-fat" />
                    <span className="font-medium">Target Lemak</span>
                  </div>
                  <span className="font-bold tabular-nums text-macro-fat">
                    {formatGram(plan.targetDailyFatG)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link href="/login" className="block pt-2">
                <Button className="w-full gap-2 font-semibold shadow-md">
                  Simpan Rencana Ini ke Akun Kamu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

