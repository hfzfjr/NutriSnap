"use client";

import {
  type ActivityLevel,
  type Gender,
  calculateNutritionPlan,
} from "@nutrisnap/shared";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Scale,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ByokKeyCard } from "@/components/settings/byok-key-card";
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<Gender>("male");
  const [age, setAge] = React.useState(22);
  const [heightCm, setHeightCm] = React.useState(170);
  const [currentWeightKg, setCurrentWeightKg] = React.useState(60);
  const [activityLevel, setActivityLevel] =
    React.useState<ActivityLevel>("moderate");
  const [targetWeightKg, setTargetWeightKg] = React.useState(65);
  const [timelineUnit, setTimelineUnit] = React.useState<"months" | "years">(
    "months"
  );
  const [timelineValue, setTimelineValue] = React.useState(4);

  const targetTimelineMonths =
    timelineUnit === "years"
      ? Math.max(1, Math.round(timelineValue * 12))
      : Math.max(1, Math.round(timelineValue));

  const previewPlan = React.useMemo(
    () =>
      calculateNutritionPlan({
        gender,
        age: age || 22,
        heightCm: heightCm || 170,
        currentWeightKg: currentWeightKg || 60,
        targetWeightKg: targetWeightKg || 60,
        targetTimelineMonths,
        activityLevel,
      }),
    [
      gender,
      age,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      targetTimelineMonths,
      activityLevel,
    ]
  );

  // Ambil profil saat ini jika ada (mode edit atau nama pengguna Google)
  React.useEffect(() => {
    let isMounted = true;
    apiFetch<{
      user: { id: string; name: string | null; email: string };
      onboardingCompleted: boolean;
      profile: {
        gender: Gender;
        age: number;
        heightCm: number;
        currentWeightKg: number;
        targetWeightKg: number;
        targetTimelineMonths: number;
        activityLevel: ActivityLevel;
      } | null;
    }>("/auth/me")
      .then((res) => {
        if (!isMounted) return;
        if (res.user?.name && !name) {
          setName(res.user.name);
        }
        if (res.profile) {
          setGender(res.profile.gender);
          setAge(res.profile.age);
          setHeightCm(res.profile.heightCm);
          setCurrentWeightKg(res.profile.currentWeightKg);
          setTargetWeightKg(res.profile.targetWeightKg);
          setTimelineUnit("months");
          setTimelineValue(res.profile.targetTimelineMonths);
          setActivityLevel(res.profile.activityLevel);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveOnboarding = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await apiFetch("/profile/onboarding", {
        method: "POST",
        body: JSON.stringify({
          name,
          gender,
          age,
          heightCm,
          currentWeightKg,
          targetWeightKg,
          targetTimelineMonths,
          activityLevel,
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta",
        }),
      });
      setStep(4);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan profil onboarding."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="default">Langkah {step} dari 4</Badge>
          <span className="text-xs font-medium text-muted-foreground">
            Personalisasi Tubuh & Target Makro
          </span>
        </div>
        <Progress value={(step / 4) * 100} />
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserCheck className="h-5 w-5 text-primary" />
              1. Data Fisik Dasar Anda
            </CardTitle>
            <CardDescription>
              Data ini digunakan untuk menghitung BMI dan Basal Metabolic Rate (Mifflin-St Jeor).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nama Lengkap / Panggilan</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Raka Pratama"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={gender === "male" ? "default" : "outline"}
                  onClick={() => setGender("male")}
                >
                  Pria
                </Button>
                <Button
                  type="button"
                  variant={gender === "female" ? "default" : "outline"}
                  onClick={() => setGender("female")}
                >
                  Wanita
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Usia (Tahun)</label>
                <Input
                  type="number"
                  min={13}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tinggi (cm)</label>
                <Input
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Berat Saat Ini (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={25}
                  max={300}
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tingkat Aktivitas Harian</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["sedentary", "Sedentary (Jarang Olahraga)"],
                    ["light", "Light (Olahraga 1-2x/minggu)"],
                    ["moderate", "Moderate (Olahraga 3-5x/minggu)"],
                    ["active", "Active (Olahraga 6-7x/minggu)"],
                  ] as const
                ).map(([lvl, label]) => (
                  <Button
                    key={lvl}
                    type="button"
                    size="sm"
                    variant={activityLevel === lvl ? "default" : "outline"}
                    className="justify-start text-xs"
                    onClick={() => setActivityLevel(lvl)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} className="gap-2">
                Lanjut ke Target Berat
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-primary" />
              2. Target Berat Badan & Timeline
            </CardTitle>
            <CardDescription>
              Tentukan berat badan impian Anda dan target waktu pencapaian dalam bulan atau tahun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Berat Badan Saat Ini (kg)
                </label>
                <Input type="number" value={currentWeightKg} disabled />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Target Berat Badan (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min={25}
                  max={300}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">
                  Target Waktu Pencapaian ({timelineUnit === "months" ? "Bulan" : "Tahun"})
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={timelineUnit === "months" ? "default" : "outline"}
                    onClick={() => {
                      setTimelineUnit("months");
                      setTimelineValue(5);
                    }}
                  >
                    Bulan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={timelineUnit === "years" ? "default" : "outline"}
                    onClick={() => {
                      setTimelineUnit("years");
                      setTimelineValue(1);
                    }}
                  >
                    Tahun
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={timelineUnit === "months" ? 60 : 5}
                value={timelineValue}
                onChange={(e) => setTimelineValue(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">
                Total durasi program: <strong>{targetTimelineMonths} bulan</strong> (
                {previewPlan.goalType === "bulking"
                  ? `Surplus Bulking +${(targetWeightKg - currentWeightKg).toFixed(1)} kg`
                  : previewPlan.goalType === "cutting"
                  ? `Defisit Cutting ${(targetWeightKg - currentWeightKg).toFixed(1)} kg`
                  : "Maintenance Berat Ideal"}
                )
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Lihat Hasil Kalkulasi
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-emerald-500" />
                3. Blueprint Nutrisi Harian Anda
              </CardTitle>
              <Badge
                variant={
                  previewPlan.goalType === "bulking"
                    ? "surplus"
                    : previewPlan.goalType === "cutting"
                    ? "deficit"
                    : "maintenance"
                }
              >
                Program: {previewPlan.goalType.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              Dihitung otomatis berdasarkan BMI, BMR, dan TDEE tubuh Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewPlan.healthWarningMessage && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300">
                {previewPlan.healthWarningMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-secondary/60 p-3">
                <span className="text-[11px] text-muted-foreground">Skor BMI</span>
                <p className="text-xl font-bold tabular-nums">
                  {previewPlan.bmiScore}
                </p>
                <span className="text-[11px] capitalize text-primary font-medium">
                  {previewPlan.bmiCategory}
                </span>
              </div>

              <div className="rounded-xl bg-secondary/60 p-3">
                <span className="text-[11px] text-muted-foreground">
                  Maintenance (TDEE)
                </span>
                <p className="text-xl font-bold tabular-nums">
                  {previewPlan.maintenanceCalories}
                </p>
                <span className="text-[11px] text-muted-foreground">kcal / hari</span>
              </div>

              <div className="rounded-xl bg-primary/15 p-3 border border-primary/30">
                <span className="text-[11px] font-medium text-primary">
                  Target Kalori
                </span>
                <p className="text-xl font-extrabold tabular-nums text-primary">
                  {previewPlan.targetDailyCalories}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  ({previewPlan.dailyCalorieDelta >= 0 ? "+" : ""}
                  {previewPlan.dailyCalorieDelta} kcal)
                </span>
              </div>

              <div className="rounded-xl bg-indigo-500/15 p-3 border border-indigo-500/30">
                <span className="text-[11px] font-medium text-indigo-500">
                  Target Protein
                </span>
                <p className="text-xl font-extrabold tabular-nums text-indigo-500">
                  {previewPlan.targetDailyProteinG}g
                </p>
                <span className="text-[11px] text-muted-foreground">gram / hari</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ubah Target
              </Button>
              <Button
                onClick={handleSaveOnboarding}
                disabled={isSaving}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSaving ? "Menyimpan Profil..." : "Simpan & Lanjut ke BYOK AI"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <ByokKeyCard />

          <div className="flex justify-end">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <Sparkles className="h-4 w-4" />
              Masuk ke Dashboard NutriSnap
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

