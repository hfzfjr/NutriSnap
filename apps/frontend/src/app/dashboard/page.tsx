"use client";

import type { DailyStatusEvaluation } from "@nutrisnap/shared";
import {
  BotMessageSquare,
  Calendar,
  Camera,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { CalorieRing } from "@/components/nutrition/calorie-ring";
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
import { MacroBar } from "@/components/ui/macro-bar";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-client";
import { shiftISO, todayISO } from "@/lib/date";

interface MealLogItem {
  id: string;
  foodName: string;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface MealLogEntry {
  id: string;
  loggedDate: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  source: "ai_scan" | "manual";
  title: string;
  aiNotes: string | null;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  items: MealLogItem[];
}

interface DailySummaryResponse {
  date: string;
  meals: MealLogEntry[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  targets: {
    goalType: "bulking" | "cutting" | "maintenance";
    maintenanceCalories: number;
    targetDailyCalories: number;
    targetDailyProteinG: number;
    targetDailyCarbsG: number;
    targetDailyFatG: number;
    dailyCalorieDelta: number;
  };
  status: DailyStatusEvaluation;
}

const MEAL_SECTIONS = [
  { key: "breakfast", label: "Sarapan Pagi" },
  { key: "lunch", label: "Makan Siang" },
  { key: "dinner", label: "Makan Malam" },
  { key: "snack", label: "Camilan & Suplemen" },
] as const;

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = React.useState<string>(() => todayISO());
  const [summary, setSummary] = React.useState<DailySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchDailySummary = React.useCallback(async (dateStr: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<DailySummaryResponse>(
        `/meals/daily?date=${encodeURIComponent(dateStr)}`
      );
      setSummary(data);
    } catch {
      // Galat ditangani atau user belum menyelesaikan onboarding
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchDailySummary(selectedDate);
  }, [selectedDate, fetchDailySummary]);

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await apiFetch(`/meals/${mealId}`, { method: "DELETE" });
      await fetchDailySummary(selectedDate);
    } catch {
      // Abaikan jika gagal
    }
  };

  const totals = summary?.totals ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
  const targets = summary?.targets ?? null;

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard Harian
            </h1>
            {targets ? (
              <Badge
                variant={
                  targets.goalType === "bulking"
                    ? "surplus"
                    : targets.goalType === "cutting"
                    ? "deficit"
                    : "maintenance"
                }
              >
                {targets.goalType.toUpperCase()} (
                {targets.dailyCalorieDelta >= 0
                  ? `+${targets.dailyCalorieDelta}`
                  : targets.dailyCalorieDelta}{" "}
                kcal)
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary?.status.label ??
              "Pantau kalori, protein, dan status surplus/defisit kamu hari ini."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1 border border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setSelectedDate(shiftISO(selectedDate, -1))}
              title="Hari Sebelumnya"
            >
              &larr;
            </Button>
            <Button
              type="button"
              variant={selectedDate === todayISO() ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs font-semibold"
              onClick={() => setSelectedDate(todayISO())}
            >
              Hari Ini
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setSelectedDate(shiftISO(selectedDate, 1))}
              title="Hari Berikutnya"
            >
              &rarr;
            </Button>
          </div>

          <div className="relative flex items-center">
            <Calendar className="h-4 w-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 w-40 h-9 text-xs"
            />
          </div>

          <Link href="/log">
            <Button size="sm" className="h-9 gap-1.5 shadow-sm">
              <Camera className="h-4 w-4" />
              + Scan / Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Calorie Ring & Macro Progress Grid */}
      <Card>
        <CardContent className="p-5 md:p-6">
          {isLoading ? (
            <div className="flex h-52 items-center justify-center text-xs text-muted-foreground animate-pulse">
              Memuat target dan ringkasan nutrisi...
            </div>
          ) : !targets ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium">Profil nutrisi kamu belum selesai diatur.</p>
              <Link href="/onboarding" className="mt-3">
                <Button size="sm">Atur Profil Sekarang</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
              <div className="md:col-span-5 flex justify-center">
                <CalorieRing
                  consumedCalories={totals.calories}
                  targetCalories={targets.targetDailyCalories}
                  maintenanceCalories={targets.maintenanceCalories}
                  goalType={targets.goalType}
                />
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-secondary/50 p-3.5 text-center">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Maintenance (TDEE)
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {targets.maintenanceCalories} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Target {targets.goalType}
                    </span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {targets.targetDailyCalories} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Selisih vs TDEE
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {totals.calories - targets.maintenanceCalories >= 0
                        ? `+${totals.calories - targets.maintenanceCalories}`
                        : totals.calories - targets.maintenanceCalories}{" "}
                      kcal
                    </span>
                  </div>
                </div>

                {/* Macro Progress Bars */}
                <div className="space-y-3 pt-1">
                  <MacroBar
                    type="protein"
                    consumedG={totals.proteinG}
                    targetG={targets.targetDailyProteinG}
                  />
                  <MacroBar
                    type="carbs"
                    consumedG={totals.carbsG}
                    targetG={targets.targetDailyCarbsG}
                  />
                  <MacroBar
                    type="fat"
                    consumedG={totals.fatG}
                    targetG={targets.targetDailyFatG}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Meal Sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MEAL_SECTIONS.map((section) => {
          const sectionMeals = (summary?.meals ?? []).filter(
            (m) => m.mealType === section.key
          );
          const sectionCalories = sectionMeals.reduce(
            (acc, m) => acc + m.totalCalories,
            0
          );
          const sectionProtein = sectionMeals.reduce(
            (acc, m) => acc + m.totalProteinG,
            0
          );

          return (
            <Card key={section.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Utensils className="h-4 w-4 text-primary" />
                      {section.label}
                    </CardTitle>
                    <CardDescription className="tabular-nums">
                      {sectionCalories} kcal • {sectionProtein.toFixed(1)}g Protein
                    </CardDescription>
                  </div>
                  <Link href={`/log?mealType=${section.key}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Tambah
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5">
                {isLoading ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Memuat catatan makanan...
                  </p>
                ) : sectionMeals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Belum ada catatan pada sesi {section.label.toLowerCase()}.
                  </div>
                ) : (
                  sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/50 p-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">
                            {meal.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {meal.source === "ai_scan" ? "AI Scan" : "Manual"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {meal.totalCalories} kcal •{" "}
                          <strong className="text-macro-protein font-semibold">
                            {meal.totalProteinG}g P
                          </strong>{" "}
                          • {meal.totalCarbsG}g C • {meal.totalFatG}g F
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDeleteMeal(meal.id)}
                        aria-label="Hapus makanan"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Shortcut to AI Diet Coach */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BotMessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">
                Bingung memilih menu makan berikutnya?
              </h4>
              <p className="text-xs text-muted-foreground">
                Tanyakan rekomendasi menu tinggi protein ke AI Bulking & Diet Assistant.
              </p>
            </div>
          </div>
          <Link href="/chat">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Tanya AI Coach
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

