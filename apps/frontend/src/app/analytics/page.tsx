"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Flame,
  Plus,
  Scale,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { WeightTrendChart } from "@/components/charts/weight-trend";
import { apiFetch } from "@/lib/api-client";
import {
  formatDateShort,
  formatDayNameShort,
  shiftISO,
  todayISO,
} from "@/lib/date";
import {
  formatBmiCategory,
  formatKcal,
  formatKg,
  formatNumber,
} from "@/lib/format";

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
  const [newWeightKg, setNewWeightKg] = React.useState<string>("");
  const [weightNotes, setWeightNotes] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadAnalytics = React.useCallback(async () => {
    try {
      const res = await apiFetch<AnalyticsOverviewResponse>(
        "/analytics/overview"
      );
      setData(res);
    } catch {
      // Tangani kegagalan tanpa mock fallback
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const profile = data?.profile;
  const weightLogs = data?.weightLogs ?? [];
  const targetCalories = profile?.targetDailyCalories ?? null;
  const maintenanceCalories = profile?.maintenanceCalories ?? null;
  const currentWeight = profile?.currentWeightKg ?? null;
  const targetWeight = profile?.targetWeightKg ?? null;
  const bmiScore = profile?.bmiScore ?? null;
  const bmiCategory = profile?.bmiCategory ?? "normal";

  // Pastikan selalu 7 hari lengkap (berakhir di hari ini)
  const last7Days = React.useMemo(() => {
    const list: Array<{
      date: string;
      calories: number;
      proteinG: number;
    }> = [];
    const today = todayISO();
    for (let i = 6; i >= 0; i--) {
      const dStr = shiftISO(today, -i);
      const found = data?.weeklySummary?.find((item) => item.date === dStr);
      list.push({
        date: dStr,
        calories: found?.calories ?? 0,
        proteinG: found?.proteinG ?? 0,
      });
    }
    return list;
  }, [data?.weeklySummary]);

  // Hitung ringkasan kepatuhan 7 hari nyata
  const adherenceSummary = React.useMemo(() => {
    const totalCal = last7Days.reduce((acc, d) => acc + d.calories, 0);
    const avgCal = Math.round(totalCal / 7);
    let completedDays = 0;
    if (targetCalories && targetCalories > 0) {
      completedDays = last7Days.filter((d) => {
        // Toleransi target ±10% atau mencapai target sesuai goal
        if (profile?.goalType === "cutting") {
          return d.calories > 0 && d.calories <= targetCalories;
        }
        return d.calories >= targetCalories * 0.9;
      }).length;
    }
    return { avgCal, completedDays };
  }, [last7Days, targetCalories, profile?.goalType]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Masukkan angka berat badan yang valid.");
      return;
    }

    setIsSaving(true);
    try {
      const todayStr = todayISO();
      await apiFetch("/profile/weight", {
        method: "POST",
        body: JSON.stringify({
          recordedDate: todayStr,
          weightKg: weightNum,
          notes: weightNotes.trim() || undefined,
        }),
      });
      toast.success("Catatan berat badan berhasil disimpan.");
      setNewWeightKg("");
      setWeightNotes("");
      await loadAnalytics();
    } catch {
      toast.error("Gagal menyimpan timbangan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await apiFetch(`/profile/weight/${id}`, {
        method: "DELETE",
      });
      toast.success("Catatan timbangan berhasil dihapus.");
      await loadAnalytics();
    } catch {
      toast.error("Gagal menghapus catatan timbangan.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="mt-2 h-4 w-72 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  // Jika profil belum ada, tampilkan ajakan Onboarding jujur
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Progres
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau tren berat badan, skor BMI, dan konsistensi asupan kalori.
          </p>
        </div>
        <EmptyState
          icon={<Scale className="h-6 w-6" />}
          title="Profil Nutrisi Belum Diatur"
          description="Lengkapi data fisik dan target tubuhmu terlebih dahulu agar NutriSnap dapat menghitung kebutuhan kalori dan memantau progres harianmu."
          action={
            <Link href="/onboarding">
              <Button>Mulai Onboarding</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Hitung persentase perjalanan target berat
  const weightProgress = (() => {
    if (!currentWeight || !targetWeight) return null;
    const diff = targetWeight - currentWeight;
    return {
      diff,
      isExact: Math.abs(diff) < 0.2,
      label:
        diff > 0
          ? `Kurang ${formatKg(diff)} menuju target`
          : diff < 0
          ? `Perlu turun ${formatKg(Math.abs(diff))} menuju target`
          : "Target tercapai!",
    };
  })();

  const maxWeeklyCalories = Math.max(
    targetCalories ?? 2000,
    ...last7Days.map((d) => d.calories),
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Progres
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau tren berat badan, skor BMI, dan konsistensi asupan kalori.
        </p>
      </div>

      {/* 3 Kartu Ringkas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Kartu 1: Berat Sekarang & Target */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Scale className="h-4 w-4 text-primary" />
              Berat Sekarang & Target
            </CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-foreground">
              {currentWeight != null ? formatKg(currentWeight) : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {targetWeight != null ? (
              <>
                <p>
                  Target:{" "}
                  <strong className="text-foreground">
                    {formatKg(targetWeight)}
                  </strong>
                </p>
                {weightProgress && (
                  <p className="font-medium text-primary">
                    {weightProgress.label}
                  </p>
                )}
              </>
            ) : (
              <p>Target belum diatur</p>
            )}
          </CardContent>
        </Card>

        {/* Kartu 2: BMI */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Indeks Massa Tubuh (BMI)
            </CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-foreground">
              {bmiScore != null ? bmiScore.toFixed(1) : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
              {formatBmiCategory(bmiCategory)}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Klasifikasi WHO · bukan diagnosis klinis.
            </p>
          </CardContent>
        </Card>

        {/* Kartu 3: Target Harian */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-4 w-4 text-accent" />
              Target Nutrisi Harian
            </CardDescription>
            <CardTitle className="font-display text-2xl font-extrabold tabular-nums text-foreground">
              {targetCalories != null ? formatKcal(targetCalories) : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>
              Protein:{" "}
              <strong className="text-foreground">
                {profile.targetDailyProteinG} g/hari
              </strong>
            </p>
            {maintenanceCalories != null && (
              <p className="text-[11px]">
                Maintenance: {formatKcal(maintenanceCalories)}/hari
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafik Tren Berat Badan */}
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tren Berat Badan
          </CardTitle>
          <CardDescription className="text-xs">
            Garis perkembangan berat badanmu dibandingkan target{" "}
            {targetWeight != null ? formatKg(targetWeight) : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightTrendChart
            logs={weightLogs}
            targetWeightKg={targetWeight}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kepatuhan Kalori & Protein 7 Hari */}
        <Card className="rounded-2xl border-border bg-card lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Flame className="h-5 w-5 text-primary" />
              Kepatuhan 7 Hari Terakhir
            </CardTitle>
            <CardDescription className="text-xs">
              {adherenceSummary.completedDays > 0 || adherenceSummary.avgCal > 0
                ? `Rata-rata ${formatKcal(adherenceSummary.avgCal)} · Target tercapai ${adherenceSummary.completedDays} dari 7 hari.`
                : "Belum ada catatan asupan pada 7 hari terakhir."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Visual 7 Kolom */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {last7Days.map((day) => {
                const ratio = Math.min(
                  1,
                  day.calories / maxWeeklyCalories
                );
                const heightPct = Math.round(ratio * 100);
                const isToday = day.date === todayISO();
                const hasData = day.calories > 0;

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1.5 text-center"
                  >
                    {/* Bar visual */}
                    <div className="relative flex h-36 w-full items-end justify-center rounded-xl bg-secondary/60 p-1">
                      {/* Target line indicator */}
                      {targetCalories && targetCalories <= maxWeeklyCalories && (
                        <div
                          className="absolute inset-x-0 border-b border-dashed border-muted-foreground/30"
                          style={{
                            bottom: `${Math.round(
                              (targetCalories / maxWeeklyCalories) * 100
                            )}%`,
                          }}
                          title={`Target: ${formatKcal(targetCalories)}`}
                        />
                      )}

                      <div
                        className={`w-full rounded-lg transition-all duration-300 ${
                          hasData ? "bg-primary" : "bg-muted"
                        }`}
                        style={{ height: `${Math.max(hasData ? 12 : 4, heightPct)}%` }}
                        title={`${formatDateShort(day.date)}: ${formatKcal(
                          day.calories
                        )} • ${day.proteinG}g P`}
                      />
                    </div>

                    {/* Kalori & Protein */}
                    <span className="text-[11px] font-semibold tabular-nums text-foreground">
                      {day.calories > 0 ? formatNumber(day.calories) : "0"}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {day.proteinG > 0 ? `${day.proteinG}g P` : "-"}
                    </span>

                    {/* Hari & Tanggal */}
                    <div className="mt-1 flex flex-col">
                      <span
                        className={`text-[11px] font-medium ${
                          isToday ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {formatDayNameShort(day.date)}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {formatDateShort(day.date).split(" ")[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Catat Timbangan & Riwayat */}
        <Card className="rounded-2xl border-border bg-card lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Scale className="h-5 w-5 text-primary" />
              Catat Timbangan
            </CardTitle>
            <CardDescription className="text-xs">
              Timbang badan secara berkala untuk memperbarui kalkulasi target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogWeight} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="weight-input" className="text-xs font-medium text-foreground">
                    Berat (kg)
                  </label>
                  <Input
                    id="weight-input"
                    type="number"
                    step="0.1"
                    min={25}
                    max={300}
                    placeholder={
                      currentWeight != null ? String(currentWeight) : "60.0"
                    }
                    value={newWeightKg}
                    onChange={(e) => setNewWeightKg(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="notes-input" className="text-xs font-medium text-foreground">
                    Catatan (opsional)
                  </label>
                  <Input
                    id="notes-input"
                    placeholder="mis. Bangun tidur"
                    value={weightNotes}
                    onChange={(e) => setWeightNotes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full gap-1.5 min-h-[44px]"
                disabled={isSaving}
              >
                <Plus className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Timbangan"}
              </Button>
            </form>

            {/* Riwayat Timbangan 5 Terakhir */}
            <div className="space-y-2 border-t border-border pt-3">
              <span className="block text-xs font-semibold text-foreground">
                Riwayat Timbangan Terakhir
              </span>
              {weightLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada riwayat timbangan tercatat.
                </p>
              ) : (
                weightLogs.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatKg(w.weightKg)}
                      </span>
                      {w.notes && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({w.notes})
                        </span>
                      )}
                      <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                        {formatDateShort(w.recordedDate)} · BMI {w.bmiScore.toFixed(1)}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === w.id}
                      onClick={() => void handleDeleteWeight(w.id)}
                      aria-label={`Hapus timbangan ${formatKg(w.weightKg)} pada ${formatDateShort(w.recordedDate)}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
