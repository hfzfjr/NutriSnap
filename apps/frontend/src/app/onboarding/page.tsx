"use client";

import {
  type ActivityLevel,
  type Gender,
  calculateNutritionPlan,
} from "@nutrisnap/shared";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-client";
import { formatBmiCategory, formatGram, formatKcal, formatNumber } from "@/lib/format";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Jarang Bergerak (BMR × 1.2)", desc: "Bekerja duduk, tanpa olahraga rutin" },
  { value: "light", label: "Aktivitas Ringan (BMR × 1.375)", desc: "Olahraga 1–3 hari/minggu" },
  { value: "moderate", label: "Aktivitas Sedang (BMR × 1.55)", desc: "Olahraga 3–5 hari/minggu" },
  { value: "active", label: "Sangat Aktif (BMR × 1.725)", desc: "Olahraga 6–7 hari/minggu" },
  { value: "very_active", label: "Atletis / Fisik Berat (BMR × 1.9)", desc: "Latihan berat 2x sehari atau buruh fisik" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<Gender>("male");
  const [age, setAge] = React.useState(24);
  const [heightCm, setHeightCm] = React.useState(172);
  const [currentWeightKg, setCurrentWeightKg] = React.useState(60);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>("moderate");
  const [targetWeightKg, setTargetWeightKg] = React.useState(66);
  const [timelineUnit, setTimelineUnit] = React.useState<"months" | "years">("months");
  const [timelineValue, setTimelineValue] = React.useState(5);

  const targetTimelineMonths =
    timelineUnit === "years"
      ? Math.max(1, Math.round(timelineValue * 12))
      : Math.max(1, Math.round(timelineValue));

  const previewPlan = React.useMemo(
    () =>
      calculateNutritionPlan({
        gender,
        age: age || 24,
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
          setIsEditMode(true);
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

  // Rekomendasi durasi aman jika terkena guardrail
  const recommendedSafeMonths = React.useMemo(() => {
    const diff = Math.abs(targetWeightKg - currentWeightKg);
    const maxSafeKgPerMonth = targetWeightKg > currentWeightKg ? 1.5 : 2.5;
    return Math.max(2, Math.ceil(diff / maxSafeKgPerMonth));
  }, [targetWeightKg, currentWeightKg]);

  const handleApplySafeDuration = () => {
    setTimelineUnit("months");
    setTimelineValue(recommendedSafeMonths);
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg("Silakan masukkan nama atau panggilan kamu.");
      return false;
    }
    if (age < 12 || age > 100) {
      setErrorMsg("Usia harus antara 12 dan 100 tahun.");
      return false;
    }
    if (heightCm < 80 || heightCm > 250) {
      setErrorMsg("Tinggi badan harus antara 80 dan 250 cm.");
      return false;
    }
    if (currentWeightKg < 30 || currentWeightKg > 300) {
      setErrorMsg("Berat badan harus antara 30 dan 300 kg.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (targetWeightKg < 30 || targetWeightKg > 300) {
      setErrorMsg("Target berat badan harus antara 30 dan 300 kg.");
      return false;
    }
    if (targetTimelineMonths < 1 || targetTimelineMonths > 60) {
      setErrorMsg("Target durasi harus antara 1 dan 60 bulan.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSaveOnboarding = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await apiFetch("/profile/onboarding", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
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
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="default">Langkah {step} dari 4</Badge>
          <span className="text-xs font-semibold text-muted-foreground">
            {isEditMode ? "Perbarui Profil & Target" : "Personalisasi Profil Nutrisi"}
          </span>
        </div>
        <Progress value={(step / 4) * 100} />
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive font-medium">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: DATA FISIK DASAR */}
      {step === 1 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-primary" />
              1. Data Fisik Dasar Kamu
            </CardTitle>
            <CardDescription>
              Digunakan untuk menghitung BMI dan Basal Metabolic Rate (BMR Mifflin-St Jeor).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nama Panggilan / Lengkap" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Raka Pratama"
              />
            </Field>

            <Field label="Jenis Kelamin">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={gender === "male" ? "default" : "outline"}
                  onClick={() => setGender("male")}
                  className="h-10"
                >
                  Pria
                </Button>
                <Button
                  type="button"
                  variant={gender === "female" ? "default" : "outline"}
                  onClick={() => setGender("female")}
                  className="h-10"
                >
                  Wanita
                </Button>
              </div>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Usia (Tahun)" required>
                <Input
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </Field>
              <Field label="Tinggi (cm)" required>
                <Input
                  type="number"
                  min={80}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                />
              </Field>
              <Field label="Berat (kg)" required>
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

            <Field label="Tingkat Aktivitas Harian">
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActivityLevel(opt.value)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                      activityLevel === opt.value
                        ? "border-primary bg-primary/10 font-semibold text-foreground ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                    </div>
                    {activityLevel === opt.value && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="gap-2"
              >
                Lanjut ke Target Berat
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: TARGET BERAT & TIMELINE */}
      {step === 2 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-primary" />
              2. Target Berat Badan & Timeline
            </CardTitle>
            <CardDescription>
              Tentukan berat badan sasaran dan jangka waktu pencapaian yang realistis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Berat Badan Saat Ini">
                <Input type="number" value={currentWeightKg} disabled className="bg-secondary/50" />
              </Field>

              <Field label="Target Berat Badan (kg)" required>
                <Input
                  type="number"
                  step="0.5"
                  min={30}
                  max={300}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Target Waktu Pencapaian ({timelineUnit === "months" ? "Bulan" : "Tahun"})
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={timelineUnit === "months" ? "default" : "outline"}
                    className="h-8 text-xs"
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
                    className="h-8 text-xs"
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
                Total durasi: <strong>{targetTimelineMonths} bulan</strong> (
                {previewPlan.goalType === "bulking"
                  ? `Surplus Bulking +${(targetWeightKg - currentWeightKg).toFixed(1)} kg`
                  : previewPlan.goalType === "cutting"
                  ? `Defisit Cutting ${(targetWeightKg - currentWeightKg).toFixed(1)} kg`
                  : "Maintenance Berat Ideal"}
                )
              </p>
            </div>

            <div className="flex justify-between pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <Button
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="gap-2"
              >
                Lihat Blueprint Nutrisi
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: BLUEPRINT NUTRISI & GUARDRAIL */}
      {step === 3 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-primary" />
                3. Blueprint Nutrisi Harian Kamu
              </CardTitle>
              <Badge
                variant={
                  previewPlan.goalType === "bulking"
                    ? "surplus"
                    : previewPlan.goalType === "cutting"
                    ? "deficit"
                    : "maintenance"
                }
                className="uppercase"
              >
                Program: {previewPlan.goalType}
              </Badge>
            </div>
            <CardDescription>
              Dihitung otomatis berdasarkan rumus ilmiah BMR Mifflin-St Jeor & TDEE harian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actionable Health Guardrail Warning */}
            {previewPlan.healthWarningMessage && (
              <div className="rounded-2xl border border-status-under/40 bg-status-under/10 p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-status-under shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      Peringatan Kecepatan Target
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {previewPlan.healthWarningMessage}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplySafeDuration}
                  className="w-full text-xs font-semibold border-status-under/40 hover:bg-status-under/20"
                >
                  Sesuaikan Durasi Menjadi {recommendedSafeMonths} Bulan Agar Lebih Aman
                </Button>
              </div>
            )}

            {/* Macro Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-2xl bg-secondary/60 p-3">
                <span className="text-[11px] text-muted-foreground block">Skor BMI</span>
                <p className="text-xl font-bold tabular-nums">{previewPlan.bmiScore}</p>
                <span className="text-[11px] text-primary font-semibold capitalize">
                  {formatBmiCategory(previewPlan.bmiCategory)}
                </span>
              </div>

              <div className="rounded-2xl bg-secondary/60 p-3">
                <span className="text-[11px] text-muted-foreground block">TDEE Maintenance</span>
                <p className="text-xl font-bold tabular-nums">
                  {formatNumber(previewPlan.maintenanceCalories)}
                </p>
                <span className="text-[11px] text-muted-foreground block">kcal / hari</span>
              </div>

              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3">
                <span className="text-[11px] text-primary font-semibold block">Target Kalori</span>
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatKcal(previewPlan.targetDailyCalories)}
                </p>
                <span className="text-[11px] text-muted-foreground block">
                  ({previewPlan.dailyCalorieDelta >= 0 ? "+" : ""}
                  {formatNumber(previewPlan.dailyCalorieDelta)} kcal)
                </span>
              </div>

              <div className="rounded-2xl bg-macro-protein/10 border border-macro-protein/20 p-3">
                <span className="text-[11px] text-macro-protein font-semibold block">Target Protein</span>
                <p className="text-xl font-bold tabular-nums text-macro-protein">
                  {formatGram(previewPlan.targetDailyProteinG)}
                </p>
                <span className="text-[11px] text-muted-foreground block">gram / hari</span>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ubah Target
              </Button>
              <Button
                onClick={() => void handleSaveOnboarding()}
                disabled={isSaving}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSaving
                  ? "Menyimpan Profil..."
                  : isEditMode
                  ? "Simpan Perubahan Profil"
                  : "Simpan & Lanjut ke BYOK AI"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: SELESAI / SETUP BYOK GEMINI */}
      {step === 4 && (
        <div className="space-y-4">
          <ByokKeyCard />

          <div className="flex justify-end pt-2">
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
