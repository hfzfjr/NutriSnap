"use client";

import {
  calculateNutritionPlan,
  evaluateDailySurplusDeficitStatus,
} from "@nutrisnap/shared";
import {
  BotMessageSquare,
  Camera,
  CheckCircle2,
  Flame,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const [currentWeightKg, setCurrentWeightKg] = React.useState(58.5);
  const [targetWeightKg, setTargetWeightKg] = React.useState(66.0);
  const [heightCm, setHeightCm] = React.useState(172);
  const [timelineMonths, setTimelineMonths] = React.useState(5);

  const plan = React.useMemo(
    () =>
      calculateNutritionPlan({
        gender: "male",
        age: 22,
        heightCm: heightCm || 170,
        currentWeightKg: currentWeightKg || 60,
        targetWeightKg: targetWeightKg || 65,
        targetTimelineMonths: timelineMonths || 4,
        activityLevel: "moderate",
      }),
    [currentWeightKg, targetWeightKg, heightCm, timelineMonths]
  );

  const consumedCalories = 2120;
  const consumedProteinG = 96;

  const dailyStatus = React.useMemo(
    () =>
      evaluateDailySurplusDeficitStatus({
        consumedCalories,
        consumedProteinG,
        maintenanceCalories: plan.maintenanceCalories,
        targetDailyCalories: plan.targetDailyCalories,
        targetDailyProteinG: plan.targetDailyProteinG,
        goalType: plan.goalType,
      }),
    [plan]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              NutriSnap Command Center
            </h1>
            <Badge
              variant={
                plan.goalType === "bulking"
                  ? "surplus"
                  : plan.goalType === "cutting"
                  ? "deficit"
                  : "maintenance"
              }
            >
              {plan.goalType === "bulking"
                ? `Bulking (+${plan.dailyCalorieDelta} kcal)`
                : plan.goalType === "cutting"
                ? `Cutting (${plan.dailyCalorieDelta} kcal)`
                : "Maintenance"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Snap Your Plate. Hit Your Macros. Powered by Google Gemini Multimodal & BYOK Vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Camera className="h-4 w-4" />
            Scan Foto Makanan
          </Button>
        </div>
      </div>

      {/* Bento Top Grid: Calorie & Surplus Hero + Live Onboarding Calculator Preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Main Calorie & Macro Ring Card */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-emerald-500" />
                  Target Kalori & Status Surplus Harian
                </CardTitle>
                <CardDescription>{dailyStatus.label}</CardDescription>
              </div>
              <Badge variant="outline" className="tabular-nums">
                BMI {plan.bmiScore} ({plan.bmiCategory})
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl bg-secondary/50 p-4">
              <div>
                <span className="text-xs text-muted-foreground">
                  Kalori Masuk Hari Ini
                </span>
                <p className="text-3xl font-extrabold tabular-nums text-emerald-500">
                  {consumedCalories.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    kcal
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Maintenance (TDEE)
                </span>
                <p className="text-2xl font-bold tabular-nums">
                  {plan.maintenanceCalories.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    kcal
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Target Harian ({plan.goalType})
                </span>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {plan.targetDailyCalories.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    kcal
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Progres Kalori Harian</span>
                <span className="tabular-nums">
                  {dailyStatus.calorieProgressPercent}% • Sisa{" "}
                  {Math.max(0, dailyStatus.caloriesRemainingToTarget)} kcal
                </span>
              </div>
              <Progress
                value={dailyStatus.calorieProgressPercent}
                indicatorClassName="bg-emerald-500"
              />
            </div>

            {/* 3 Macro Split Bars */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-indigo-500">Protein</span>
                  <span className="tabular-nums font-medium">
                    {consumedProteinG}g / {plan.targetDailyProteinG}g
                  </span>
                </div>
                <Progress
                  value={dailyStatus.proteinProgressPercent}
                  indicatorClassName="bg-indigo-500"
                />
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-amber-500">Karbohidrat</span>
                  <span className="tabular-nums font-medium">
                    245g / {plan.targetDailyCarbsG}g
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    Math.round((245 / Math.max(1, plan.targetDailyCarbsG)) * 100)
                  )}
                  indicatorClassName="bg-amber-500"
                />
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-rose-500">Lemak</span>
                  <span className="tabular-nums font-medium">
                    58g / {plan.targetDailyFatG}g
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    Math.round((58 / Math.max(1, plan.targetDailyFatG)) * 100)
                  )}
                  indicatorClassName="bg-rose-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Shared Nutrition Calculator Simulator */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Kalkulator Target Bulking & Diet
            </CardTitle>
            <CardDescription>
              Terhubung langsung ke paket <code>@nutrisnap/shared</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Berat Saat Ini (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Target Berat (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Tinggi Badan (cm)
                </label>
                <Input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Target Durasi (Bulan)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(Number(e.target.value))}
                />
              </div>
            </div>

            {plan.healthWarningMessage && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300">
                {plan.healthWarningMessage}
              </div>
            )}

            <div className="rounded-xl bg-secondary/60 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basal Metabolic Rate (BMR):</span>
                <span className="font-semibold tabular-nums">{plan.bmrCalories} kcal/hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delta Kalori Harian:</span>
                <span className="font-semibold tabular-nums text-primary">
                  {plan.dailyCalorieDelta > 0
                    ? `+${plan.dailyCalorieDelta}`
                    : plan.dailyCalorieDelta}{" "}
                  kcal/hari
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rekomendasi Protein:</span>
                <span className="font-semibold tabular-nums">
                  {plan.targetDailyProteinG} gram/hari
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Pillars Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Dual Nutrition Logging
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Scan piring makan Anda dengan <strong>Gemini 2.5 Flash Multimodal</strong> atau
            input cepat nama makanan + berat (gram) dari katalog lokal Indonesia.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              BYOK AES-256-GCM Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Google Gemini API Key Anda dienkripsi menggunakan <code>AES-256-GCM</code> dengan
            IV unik 96-bit di server Coolify dan tidak pernah diekspos ke browser.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BotMessageSquare className="h-4 w-4 text-cyan-500" />
              AI Bulking & PWA Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Chatbot asisten diet kontekstual & pengingat Web Push terjadwal untuk waktu makan
            harian yang belum di-log di iOS dan Android.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

