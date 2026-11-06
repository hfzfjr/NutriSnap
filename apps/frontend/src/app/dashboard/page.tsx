"use client";

import type { DailyStatusEvaluation } from "@nutrisnap/shared";
import {
  AlertCircle,
  BotMessageSquare,
  Calendar,
  Camera,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { CalorieRing } from "@/components/nutrition/calorie-ring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MacroBar } from "@/components/ui/macro-bar";
import { StatusPill } from "@/components/ui/status-pill";
import { apiFetch } from "@/lib/api-client";
import { formatDateLong, shiftISO, todayISO } from "@/lib/date";
import { formatGram, formatKcal, formatNumber } from "@/lib/format";

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
  { key: "breakfast", label: "Sarapan Pagi", desc: "Mulai hari dengan kalori & protein berkualitas" },
  { key: "lunch", label: "Makan Siang", desc: "Isi bahan bakar energi untuk aktivitas harian" },
  { key: "dinner", label: "Makan Malam", desc: "Nutrisi pemulihan otot & istirahat" },
  { key: "snack", label: "Camilan & Suplemen", desc: "Whey, buah, atau camilan pendukung target" },
] as const;

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = React.useState<string>(() => todayISO());
  const [summary, setSummary] = React.useState<DailySummaryResponse | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Ambil data profil / nama user
  React.useEffect(() => {
    apiFetch<{ user: { name: string | null } }>("/auth/me")
      .then((res) => {
        if (res.user?.name) setUserName(res.user.name);
      })
      .catch(() => {});
  }, []);

  const fetchDailySummary = React.useCallback(async (dateStr: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<DailySummaryResponse>(
        `/meals/daily?date=${encodeURIComponent(dateStr)}`
      );
      setSummary(data);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal memuat catatan makan. Pastikan profil onboarding kamu sudah terisi."
      );
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchDailySummary(selectedDate);
  }, [selectedDate, fetchDailySummary]);

  const handleDeleteMeal = async (mealId: string, mealTitle: string) => {
    try {
      await apiFetch(`/meals/${mealId}`, { method: "DELETE" });
      toast.success(`"${mealTitle}" berhasil dihapus dari jurnal.`);
      await fetchDailySummary(selectedDate);
    } catch {
      toast.error("Gagal menghapus catatan makanan.");
    }
  };

  const totals = summary?.totals ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
  const targets = summary?.targets ?? null;

  // Sapaan personal berbasis jam lokal
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const prefix =
      hour < 11
        ? "Selamat Pagi"
        : hour < 15
        ? "Selamat Siang"
        : hour < 19
        ? "Selamat Sore"
        : "Selamat Malam";
    return userName ? `${prefix}, ${userName.split(" ")[0]}` : prefix;
  }, [userName]);

  return (
    <div className="space-y-6">
      {/* Header, Greeting & Date Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {greeting}
            </h1>
            {targets ? (
              <StatusPill
                status={
                  targets.goalType === "bulking"
                    ? "surplus"
                    : targets.goalType === "cutting"
                    ? "deficit"
                    : "maintenance"
                }
                label={`${targets.goalType.toUpperCase()} (${
                  targets.dailyCalorieDelta >= 0
                    ? `+${targets.dailyCalorieDelta}`
                    : targets.dailyCalorieDelta
                } kcal)`}
              />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateLong(selectedDate)} •{" "}
            {summary?.status.label ??
              "Pantau kalori, protein, dan status surplus/defisit kamu hari ini."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary/70 rounded-xl p-1 border border-border">
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
              className="pl-9 w-36 h-9 text-xs"
            />
          </div>

          <Link href="/log">
            <Button size="sm" className="h-9 gap-1.5 shadow-sm">
              <Camera className="h-4 w-4" />
              + Catat Makanan
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state with retry */}
      {errorMsg && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 flex items-center justify-between gap-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void fetchDailySummary(selectedDate)}
            className="h-8 gap-1.5 text-xs border-destructive/40 hover:bg-destructive/10"
          >
            <RefreshCw className="h-3 w-3" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Hero Calorie Ring & Macro Progress Grid */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-5 md:p-6">
          {isLoading ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Memuat target dan ringkasan nutrisi...</span>
            </div>
          ) : !targets ? (
            <EmptyState
              icon={<Utensils className="h-6 w-6 text-primary" />}
              title="Profil Nutrisi Belum Lengkap"
              description="Lengkapi data fisik dasar kamu agar NutriSnap dapat menghitung target kalori dan protein harian secara personal."
              action={
                <Link href="/onboarding">
                  <Button size="sm">Atur Profil Sekarang</Button>
                </Link>
              }
            />
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
                <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-secondary/60 p-3.5 text-center">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Maintenance (TDEE)
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatKcal(targets.maintenanceCalories)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block capitalize">
                      Target {targets.goalType}
                    </span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {formatKcal(targets.targetDailyCalories)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Selisih vs TDEE
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {totals.calories - targets.maintenanceCalories >= 0
                        ? `+${formatNumber(totals.calories - targets.maintenanceCalories)}`
                        : formatNumber(totals.calories - targets.maintenanceCalories)}{" "}
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

      {/* Daily Meal Sections (4 Kartu Sesi Makan) */}
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
            <Card key={section.key} className="border-border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Utensils className="h-4 w-4 text-primary" />
                      {section.label}
                    </CardTitle>
                    <CardDescription className="tabular-nums text-xs">
                      {formatKcal(sectionCalories)} • {formatGram(sectionProtein)} Protein
                    </CardDescription>
                  </div>
                  <Link href={`/log?mealType=${section.key}`}>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Catat
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 p-4 flex-1">
                {isLoading ? (
                  <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                    Memuat catatan makanan...
                  </div>
                ) : sectionMeals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Belum ada catatan pada sesi {section.label.toLowerCase()}.
                  </div>
                ) : (
                  sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/50 p-3 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate text-foreground">
                            {meal.title}
                          </span>
                          <span className="text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10 shrink-0">
                            {meal.source === "ai_scan" ? "AI Scan" : "Manual"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatNumber(meal.totalCalories)} kcal •{" "}
                          <strong className="text-macro-protein font-semibold">
                            {formatGram(meal.totalProteinG)} P
                          </strong>{" "}
                          • {formatGram(meal.totalCarbsG)} C • {formatGram(meal.totalFatG)} F
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => void handleDeleteMeal(meal.id, meal.title)}
                        aria-label={`Hapus ${meal.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Shortcut to AI Coach */}
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex flex-col gap-3.5 p-4 md:py-4 md:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BotMessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground">
                Bingung memilih menu makan berikutnya?
              </h4>
              <p className="text-xs text-muted-foreground">
                Tanyakan rekomendasi menu tinggi protein yang sesuai sisa jatah kalori kamu hari ini.
              </p>
            </div>
          </div>
          <Link href="/chat" className="shrink-0">
            <Button size="sm" className="gap-1.5 shadow-sm min-h-[36px]">
              <Sparkles className="h-4 w-4" />
              Tanya Coach AI
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
