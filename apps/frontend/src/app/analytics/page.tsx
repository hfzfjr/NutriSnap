"use client";

import {
  Activity,
  Flame,
  Plus,
  Scale,
  TrendingUp,
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
import { apiFetch } from "@/lib/api-client";
import { todayISO } from "@/lib/date";

interface WeightLogEntry {
  id: string;
  recordedDate: string;
  weightKg: number;
  bmiScore: number;
  notes: string | null;
}

interface AnalyticsOverviewResponse {
  profile: {
    currentWeightKg: number;
    targetWeightKg: number;
    heightCm: number;
    bmiScore: number;
    bmiCategory: string;
    goalType: "bulking" | "cutting" | "maintenance";
    maintenanceCalories: number;
    targetDailyCalories: number;
    targetDailyProteinG: number;
  } | null;
  weightLogs: WeightLogEntry[];
  weeklySummary: Array<{
    date: string;
    calories: number;
    proteinG: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newWeightKg, setNewWeightKg] = React.useState<number | "">("");
  const [weightNotes, setWeightNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const loadAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<AnalyticsOverviewResponse>(
        "/analytics/overview"
      );
      setData(res);
      if (res.profile?.currentWeightKg) {
        setNewWeightKg(res.profile.currentWeightKg);
      }
    } catch {
      // Abaikan jika gagal
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeightKg || Number(newWeightKg) <= 0) return;

    setIsSaving(true);
    try {
      const todayStr = todayISO();
      await apiFetch("/profile/weight", {
        method: "POST",
        body: JSON.stringify({
          recordedDate: todayStr,
          weightKg: Number(newWeightKg),
          notes: weightNotes.trim() || undefined,
        }),
      });
      setWeightNotes("");
      await loadAnalytics();
    } catch {
      // Abaikan jika gagal
    } finally {
      setIsSaving(false);
    }
  };

  const profile = data?.profile;
  const currentWeight = profile?.currentWeightKg ?? null;
  const targetWeight = profile?.targetWeightKg ?? null;
  const bmiScore = profile?.bmiScore ?? null;
  const bmiCategory = profile?.bmiCategory ?? "normal";
  const targetCalories = profile?.targetDailyCalories ?? null;
  const maintenanceCalories = profile?.maintenanceCalories ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Analytics & Progres Tubuh
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau tren berat badan, skor BMI, dan konsistensi kalori mingguan Anda.
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-primary" />
              Berat Badan Saat Ini
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tabular-nums">
              {currentWeight !== null ? currentWeight : "-"}{" "}
              <span className="text-sm font-normal">kg</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {targetWeight !== null && currentWeight !== null ? (
              <>
                Target: <strong className="text-foreground">{targetWeight} kg</strong> (Selisih{" "}
                {(targetWeight - currentWeight >= 0 ? "+" : "") +
                  (targetWeight - currentWeight).toFixed(1)}{" "}
                kg)
              </>
            ) : (
              "Target belum diatur"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-indigo-500" />
              Body Mass Index (BMI)
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tabular-nums">
              {bmiScore !== null ? bmiScore : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="capitalize">
              Kategori WHO: {bmiCategory}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-emerald-500" />
              Target Kalori Harian
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tabular-nums text-emerald-500">
              {targetCalories !== null ? targetCalories.toLocaleString("id-ID") : "-"}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                kcal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Maintenance TDEE: {maintenanceCalories !== null ? `${maintenanceCalories} kcal/hari` : "-"}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Calorie & Protein Adherence Chart */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Kepatuhan Kalori & Protein 7 Hari Terakhir
            </CardTitle>
            <CardDescription>
              Perbandingan asupan kalori harian terhadap target ({targetCalories !== null ? `${targetCalories} kcal` : "Belum diatur"})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.weeklySummary ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Belum ada riwayat makan 7 hari terakhir.</p>
                <p>Catat makanan harian kamu di menu Scan / Log untuk melihat grafik kepatuhan kalori & protein.</p>
              </div>
            ) : (
              (data?.weeklySummary ?? []).map((day) => {
                const pct = Math.min(
                  100,
                  Math.round((day.calories / Math.max(1, targetCalories ?? 2000)) * 100)
                );
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium tabular-nums">{day.date}</span>
                      <span className="text-muted-foreground tabular-nums">
                        <strong className="text-foreground">{day.calories}</strong>{" "}
                        / {targetCalories !== null ? `${targetCalories} kcal` : "-"} •{" "}
                        <strong className="text-indigo-500">
                          {day.proteinG}g P
                        </strong>
                      </span>
                    </div>
                    <Progress value={pct} indicatorClassName="bg-emerald-500" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Log New Body Weight & History */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5 text-primary" />
              Catat Timbangan Berat Badan
            </CardTitle>
            <CardDescription>
              Memperbarui skor BMI dan target kalori secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogWeight} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Berat Hari Ini (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min={25}
                    max={300}
                    value={newWeightKg}
                    onChange={(e) => setNewWeightKg(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Catatan</label>
                  <Input
                    placeholder="Timbang pagi"
                    value={weightNotes}
                    onChange={(e) => setWeightNotes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full gap-1.5"
                disabled={isSaving}
              >
                <Plus className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Berat Badan"}
              </Button>
            </form>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold block">
                Riwayat Timbangan Terakhir
              </span>
              {(data?.weightLogs ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada riwayat timbangan tercatat.
                </p>
              ) : (
                (data?.weightLogs ?? []).slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold tabular-nums">
                        {w.weightKg} kg
                      </span>
                      {w.notes && (
                        <span className="text-muted-foreground ml-2">
                          ({w.notes})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="tabular-nums">
                        BMI {w.bmiScore}
                      </Badge>
                      <span className="text-muted-foreground tabular-nums">
                        {w.recordedDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

