"use client";

import {
  type ActivityLevel,
  type Gender,
  calculateNutritionPlan,
  evaluateDailySurplusDeficitStatus,
} from "@nutrisnap/shared";
import {
  ArrowRight,
  Bell,
  BotMessageSquare,
  Camera,
  CheckCircle2,
  ChevronDown,
  Flame,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogIn,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
import { getStoredAuthToken } from "@/lib/api-client";

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Live Mifflin-St Jeor interactive calculator state on landing page
  const [gender, setGender] = React.useState<Gender>("male");
  const [age, setAge] = React.useState(22);
  const [heightCm, setHeightCm] = React.useState(172);
  const [currentWeightKg, setCurrentWeightKg] = React.useState(58.5);
  const [targetWeightKg, setTargetWeightKg] = React.useState(66.0);
  const [timelineMonths, setTimelineMonths] = React.useState(5);
  const [activityLevel, setActivityLevel] =
    React.useState<ActivityLevel>("moderate");

  // Check login status on mount
  React.useEffect(() => {
    const token = getStoredAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const plan = React.useMemo(
    () =>
      calculateNutritionPlan({
        gender,
        age: age || 22,
        heightCm: heightCm || 170,
        currentWeightKg: currentWeightKg || 60,
        targetWeightKg: targetWeightKg || 65,
        targetTimelineMonths: timelineMonths || 4,
        activityLevel,
      }),
    [
      gender,
      age,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      timelineMonths,
      activityLevel,
    ]
  );

  const sampleConsumedCalories = Math.round(plan.targetDailyCalories * 0.72);
  const sampleConsumedProtein = Math.round(plan.targetDailyProteinG * 0.75);

  const dailyStatus = React.useMemo(
    () =>
      evaluateDailySurplusDeficitStatus({
        consumedCalories: sampleConsumedCalories,
        consumedProteinG: sampleConsumedProtein,
        maintenanceCalories: plan.maintenanceCalories,
        targetDailyCalories: plan.targetDailyCalories,
        targetDailyProteinG: plan.targetDailyProteinG,
        goalType: plan.goalType,
      }),
    [plan, sampleConsumedCalories, sampleConsumedProtein]
  );

  const handleStartCTA = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* 1. PUBLIC TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">NutriSnap</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-primary uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                AI Bulking & Diet
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a
              href="#fitur"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Fitur Utama
            </a>
            <a
              href="#kalkulator"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Kalkulator Nutrisi
            </a>
            <a
              href="#cara-kerja"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Cara Kerja
            </a>
            <a
              href="#keamanan"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              Keamanan BYOK
            </a>
            <a
              href="#faq"
              className="hover:text-foreground transition-colors hover:underline underline-offset-4"
            >
              FAQ
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="gap-2 shadow-sm">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Buka Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" className="gap-2 shadow-sm font-semibold">
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Akun</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/60">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>NutriSnap 2.0 • AI Multimodal Food Vision & BYOK Vault</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Snap Piring Anda. Capai Target{" "}
            <span className="text-primary bg-clip-text">Kalori & Protein</span>{" "}
            Tanpa Ribet.
          </h1>

          <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            Lacak makronutrisi makanan harian secara instan menggunakan kamera AI
            Google Gemini. Dilengkapi kalkulator ilmiah Mifflin-St Jeor, asisten
            bulking/cutting kontekstual, dan keamanan privasi mandiri{" "}
            <strong className="text-foreground">BYOK AES-256-GCM</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleStartCTA}
              className="w-full sm:w-auto text-sm font-semibold gap-2 shadow-lg shadow-primary/25 h-12 px-6"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  Masuk ke Dashboard
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Mulai Gratis Sekarang
                </>
              )}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <a href="#kalkulator" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm font-medium gap-2 h-12 px-6"
              >
                <Scale className="h-4 w-4 text-primary" />
                Coba Kalkulator Nutrisi Live
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </a>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Camera className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block">Scan &lt; 3 Detik</span>
                <span className="text-[11px] text-muted-foreground">
                  Gemini Vision 2.5
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block">AES-256-GCM Vault</span>
                <span className="text-[11px] text-muted-foreground">
                  BYOK Zero-Plaintext
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <Scale className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block">Mifflin-St Jeor</span>
                <span className="text-[11px] text-muted-foreground">
                  Formula Medis Akurat
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-500">
                <Smartphone className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block">PWA Siap Pakai</span>
                <span className="text-[11px] text-muted-foreground">
                  Push Reminder Harian
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE MIFFLIN-ST JEOR CALCULATOR SECTION */}
      <section id="kalkulator" className="py-14 md:py-20 bg-muted/20 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <Scale className="h-3.5 w-3.5 text-primary" />
              Simulasi Langsung Bebas Akun
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hitung Kebutuhan Kalori & Makronutrisi Anda
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Ubah parameter berat dan target Anda di bawah. Algoritma klinis{" "}
              <strong>Mifflin-St Jeor</strong> dari paket{" "}
              <code>@nutrisnap/shared</code> menghitung target kalori, BMR, TDEE,
              serta gram protein secara real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Input Controls Card */}
            <Card className="lg:col-span-6 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  Parameter Fisik & Target Tubuh
                </CardTitle>
                <CardDescription>
                  Pilih gender, umur, berat saat ini, dan target yang ingin dicapai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={gender === "male" ? "default" : "outline"}
                      onClick={() => setGender("male")}
                    >
                      Pria
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={gender === "female" ? "default" : "outline"}
                      onClick={() => setGender("female")}
                    >
                      Wanita
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Usia
                    </label>
                    <Input
                      type="number"
                      min={14}
                      max={90}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tinggi (cm)
                    </label>
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Target (Bulan)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={timelineMonths}
                      onChange={(e) => setTimelineMonths(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Berat Saat Ini (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      value={currentWeightKg}
                      onChange={(e) =>
                        setCurrentWeightKg(Number(e.target.value))
                      }
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
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Aktivitas Latihan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ["sedentary", "Sedentary (Jarang)"],
                        ["light", "Light (1-2x/mgg)"],
                        ["moderate", "Moderate (3-5x/mgg)"],
                        ["active", "Active (6-7x/mgg)"],
                      ] as const
                    ).map(([lvl, label]) => (
                      <Button
                        key={lvl}
                        type="button"
                        size="sm"
                        variant={activityLevel === lvl ? "default" : "outline"}
                        className="text-[11px] justify-start h-8 px-2.5"
                        onClick={() => setActivityLevel(lvl)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Blueprint Calculation Results */}
            <Card className="lg:col-span-6 border-primary/40 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-emerald-500" />
                    Hasil Blueprint Nutrisi Otomatis
                  </CardTitle>
                  <Badge
                    variant={
                      plan.goalType === "bulking"
                        ? "surplus"
                        : plan.goalType === "cutting"
                        ? "deficit"
                        : "maintenance"
                    }
                  >
                    {plan.goalType.toUpperCase()} (
                    {plan.dailyCalorieDelta >= 0
                      ? `+${plan.dailyCalorieDelta}`
                      : plan.dailyCalorieDelta}{" "}
                    kcal)
                  </Badge>
                </div>
                <CardDescription>
                  Status tubuh saat ini: BMI {plan.bmiScore} ({plan.bmiCategory})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.healthWarningMessage && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-300">
                    {plan.healthWarningMessage}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 p-3 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      BMR Alami
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {plan.bmrCalories}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      kcal/hari
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      TDEE (Maintenance)
                    </span>
                    <span className="text-base font-bold tabular-nums">
                      {plan.maintenanceCalories}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      kcal/hari
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-primary font-semibold block">
                      Target Harian
                    </span>
                    <span className="text-base font-extrabold tabular-nums text-primary">
                      {plan.targetDailyCalories}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      kcal/hari
                    </span>
                  </div>
                </div>

                {/* Macro Split Breakdown */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-indigo-500">
                      Target Protein
                    </span>
                    <span className="tabular-nums font-bold">
                      {plan.targetDailyProteinG} gram/hari
                    </span>
                  </div>
                  <Progress
                    value={100}
                    indicatorClassName="bg-indigo-500"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>
                      Karbohidrat: <strong>{plan.targetDailyCarbsG}g</strong>
                    </span>
                    <span>
                      Lemak: <strong>{plan.targetDailyFatG}g</strong>
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-primary/10 border border-primary/25 p-3 text-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-primary block">
                      Ingin langsung menyimpan rencana ini?
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Buka Dashboard atau masuk dengan akun Google Anda.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleStartCTA}
                    className="gap-1.5 shrink-0"
                  >
                    <span>Lanjut ke Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SHOWCASE */}
      <section id="fitur" className="py-14 md:py-20 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Fitur Utama Aplikasi
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Didesain untuk Efisiensi & Kemudahan Pengguna
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Tidak ada lagi kerumitan mencari satu per satu item di database asing.
              NutriSnap mengkombinasikan AI Multimodal dan katalog lokal Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 mb-2">
                  <Camera className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">
                  1. Dual Nutrition Logging
                </CardTitle>
                <CardDescription>
                  AI Food Vision & Input Manual Gram
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Ambil foto piring makan Anda, browser mengompresinya secara
                  instan (&le;1280px WebP), dan Gemini 2.5 Flash mengekstrak
                  perkiraan kalori dan gramasi protein.
                </p>
                <p>
                  Bila tanpa foto, gunakan tab input manual dengan 25+ referensi
                  makanan lokal (dada ayam, tempe goreng, nasi, telur rebus).
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500 mb-2">
                  <BotMessageSquare className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">
                  2. Contextual AI Diet Coach
                </CardTitle>
                <CardDescription>
                  Konsultasi Menu & Evaluasi Nutrisi
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Chatbot asisten bulking & diet yang otomatis membaca sisa
                  kalori dan sisa protein harian Anda hari ini.
                </p>
                <p>
                  Tanyakan: &ldquo;Malam ini saya masih kurang 35g protein, saran
                  menu yang murah apa?&rdquo; dan AI akan memberikan rekomendasi
                  yang tepat.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 mb-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">
                  3. Dashboard & Kepatuhan 7 Hari
                </CardTitle>
                <CardDescription>
                  Calorie Ring & Riwayat Berat Badan
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Visualisasi SVG Calorie Ring lingkaran yang bersih, pemisahan
                  sesi makan (Sarapan, Makan Siang, Malam, Camilan), serta
                  status surplus/defisit harian.
                </p>
                <p>
                  Halaman Analytics mencatat progres berat badan berkala dan
                  skor BMI WHO secara berkelanjutan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="cara-kerja" className="py-14 md:py-20 bg-muted/20 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Alur Penggunaan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              3 Langkah Mudah Menuju Target Tubuh Ideal
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Mulai perjalanan nutrisi Anda hanya dalam hitungan detik.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                1
              </div>
              <h3 className="font-semibold text-base">Atur Profil Onboarding</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Masukkan data fisik (usia, tinggi, berat badan, target bulking/cutting).
                NutriSnap otomatis membuat blueprint kalori dan target protein harian.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                2
              </div>
              <h3 className="font-semibold text-base">Jepret atau Input Makanan</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Saat waktu sarapan, makan siang, atau makan malam tiba, cukup foto
                piring Anda. Gemini AI mendeteksi makronutrisi dan porsinya secara akurat.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground">
                3
              </div>
              <h3 className="font-semibold text-base">Pantau & Capai Target</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lihat Calorie Ring di dashboard, konsultasikan makanan malam dengan
                AI Coach, dan pantau kenaikan/penurunan berat badan di Analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECURITY & BYOK VAULT SECTION */}
      <section id="keamanan" className="py-14 md:py-20 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 space-y-4">
                <Badge variant="default" className="gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Keamanan & Privasi Mutlak
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  BYOK (Bring Your Own Key) & Enkripsi AES-256-GCM
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Kami percaya bahwa privasi dan kuota AI Anda sepenuhnya milik Anda.
                  Kunci Google Gemini API yang Anda masukkan diatur dengan standar
                  militer <strong>AES-256-GCM</strong> (96-bit Initialization Vector unik
                  dan 128-bit Authentication Tag).
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      API Key asli <strong>tidak pernah</strong> diekspos kembali ke
                      browser (Zero Plaintext Exposure).
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      Bebas biaya langganan bulanan mahal — manfaatkan kuota gratis
                      Google AI Studio pribadi Anda.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>
                      Dapat diganti atau dihapus kapan saja melalui halaman Settings.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-3 w-full max-w-xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-semibold flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      Vault Enkripsi Server
                    </span>
                    <Badge variant="surplus">AES-256-GCM</Badge>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] bg-secondary/60 p-3 rounded-xl text-muted-foreground">
                    <p className="text-emerald-500 font-semibold">
                      Status: ENCRYPTED
                    </p>
                    <p>IV: 12-byte random base64</p>
                    <p>Tag: 16-byte auth tag</p>
                    <p>KeyHint: AIzaSy...9xQp</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Didekripsi hanya di dalam RAM server Fastify saat memanggil
                    model Gemini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION (Semantic <details> as per modern web guidance) */}
      <section id="faq" className="py-14 md:py-20 bg-muted/20 border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              Pertanyaan yang Sering Diajukan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Pertanyaan Umum Seputar NutriSnap
            </h2>
          </div>

          <div className="space-y-3">
            <details className="group rounded-2xl border border-border bg-card p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm">
                <span>Apakah NutriSnap sepenuhnya gratis digunakan?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Ya! Aplikasi NutriSnap bersifat open platform dengan skema BYOK (Bring
                Your Own Key). Anda dapat menggunakan kunci API gratis dari Google AI
                Studio (yang menyediakan ribuan request per hari tanpa biaya), sehingga
                Anda tidak perlu membayar biaya langganan bulanan.
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-card p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm">
                <span>Apakah NutriSnap bisa diinstal sebagai aplikasi di HP (PWA)?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Tentu saja! NutriSnap adalah Progressive Web App (PWA) lengkap dengan
                Service Worker dan manifest. Anda dapat memilih &ldquo;Add to Home Screen&rdquo;
                pada Safari iOS atau Chrome Android. Aplikasi juga mendukung Web Push
                Notification untuk pengingat jam sarapan, makan siang, dan makan malam.
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-card p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm">
                <span>Bagaimana jika foto makanan saya tidak terdeteksi dengan tepat?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                NutriSnap menyertakan kartu <em>Editable Confirmation Review</em> setelah
                scan foto, di mana Anda dapat mengoreksi gramasi atau menghapus item. Selain
                itu, Anda selalu bisa menggunakan mode Input Manual untuk mencari makanan
                lokal Indonesia berdasarkan berat gram.
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-card p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm">
                <span>Apa rumus yang digunakan untuk menghitung kalori dan BMR?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Kami menggunakan formula standar klinis <strong>Mifflin-St Jeor</strong>,
                yang diakui oleh para nutrisionis dan dokter olahraga sebagai salah satu
                rumus paling akurat untuk menghitung BMR dan TDEE (Total Daily Energy
                Expenditure).
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-8 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">NutriSnap</span>
            <span>&copy; {new Date().getFullYear()} — AI Nutrition & Bulking Tracker</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/hfzfjr/NutriSnap"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors hover:underline"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <Link href="/login" className="hover:text-foreground transition-colors hover:underline">
              Masuk Sesi
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-foreground transition-colors hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
