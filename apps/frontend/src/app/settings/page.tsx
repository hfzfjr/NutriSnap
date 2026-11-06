"use client";

import {
  ArrowRight,
  Bell,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Target,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PwaPushReminderCard } from "@/components/pwa/pwa-manager";
import { ByokKeyCard } from "@/components/settings/byok-key-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoalChip } from "@/components/ui/goal-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, setStoredAuthToken } from "@/lib/api-client";
import { formatKcal, formatKg } from "@/lib/format";

interface ProfileSummary {
  profile: {
    age: number;
    gender: string;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number;
    goalType: "bulking" | "cutting" | "maintenance";
    bmiScore: number;
    bmrKcal: number;
    tdeeKcal: number;
    targetDailyCalories: number;
    targetDailyProteinG?: number;
    targetProteinG?: number;
    targetDailyCarbsG?: number;
    targetCarbsG?: number;
    targetDailyFatG?: number;
    targetFatG?: number;
  } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = React.useState<{
    name: string;
    email: string;
  } | null>(null);
  const [profile, setProfile] = React.useState<ProfileSummary["profile"]>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      apiFetch<{ user: { name: string; email: string } }>("/auth/me")
        .then((res) => setUserInfo(res.user))
        .catch(() => {}),
      apiFetch<ProfileSummary>("/profile")
        .then((res) => setProfile(res.profile))
        .catch(() => {}),
    ]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Abaikan jika token kedaluwarsa
    }
    setStoredAuthToken(null);
    toast.info("Kamu telah keluar dari sesi NutriSnap.");
    router.push("/login");
  };

  const navItems = [
    { label: "Profil & Target", href: "#profil", icon: Target },
    { label: "API Key Gemini", href: "#api-key", icon: KeyRound },
    { label: "Pengingat Makan", href: "#pengingat", icon: Bell },
    { label: "Tampilan", href: "#tampilan", icon: Palette },
    { label: "Akun", href: "#akun", icon: User },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="mt-2 h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Pengaturan
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola target fisik, kunci API Gemini, jadwal pengingat makan, dan preferensi akunmu.
        </p>
      </div>

      {/* Navigasi Lompat Anchor (Scrollable di Mobile) */}
      <nav
        aria-label="Navigasi Pengaturan Cepat"
        className="flex gap-2 overflow-x-auto pb-1 text-xs scrollbar-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 font-medium text-foreground transition-colors hover:bg-secondary/60 hover:text-primary"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* 1. Ringkasan Profil & Target Nutrisi */}
      <Card id="profil" className="scroll-mt-20 rounded-2xl border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
                <Target className="h-5 w-5 text-primary" />
                Profil Fisik & Target Nutrisi
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Kalkulasi kebutuhan kalori dan makronutrisi harian berdasarkan rumus Mifflin-St Jeor.
              </CardDescription>
            </div>
            <Link href="/onboarding">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 min-h-[44px]"
              >
                <UserCheck className="h-4 w-4" />
                Ubah Target Tubuh
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile ? (
            <div className="space-y-4">
              {/* Program GoalChip */}
              <div className="max-w-md">
                <GoalChip goal={profile.goalType} selected={true} />
              </div>

              {/* Grid Metrik Tubuh & Target */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>Berat Sekarang</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>Target</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                    <span>{formatKg(profile.currentWeightKg)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{formatKg(profile.targetWeightKg)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Target Kalori Harian</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {formatKcal(profile.targetDailyCalories)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Target Protein</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {profile.targetDailyProteinG ?? profile.targetProteinG ?? 0} g/hari
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Karbo / Lemak</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-muted-foreground">
                    {profile.targetDailyCarbsG ?? profile.targetCarbsG ?? 0}g /{" "}
                    {profile.targetDailyFatG ?? profile.targetFatG ?? 0}g
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Kamu belum melengkapi profil fisik dan target berat badan.
              </p>
              <Link href="/onboarding">
                <Button size="sm">Mulai Onboarding Sekarang</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. BYOK Gemini API Key */}
      <ByokKeyCard />

      {/* 3. Pengingat Makan Terjadwal */}
      <PwaPushReminderCard />

      {/* 4. Preferensi Tampilan */}
      <Card id="tampilan" className="scroll-mt-20 rounded-2xl border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
            <Palette className="h-5 w-5 text-primary" />
            Tema & Tampilan
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pilih mode tampilan yang nyaman untuk matamu.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Palet warna "Dapur Segar" dirancang dengan kontras ramah mata yang memenuhi standar aksesibilitas WCAG AA baik di mode terang maupun gelap.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Mode Tema:</span>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* 5. Informasi Akun & Sesi */}
      <Card id="akun" className="scroll-mt-20 rounded-2xl border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
            <User className="h-5 w-5 text-primary" />
            Akun & Sesi
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Informasi akun Google yang sedang terhubung.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {userInfo?.name || "Pengguna NutriSnap"}
            </p>
            <p className="text-xs text-muted-foreground">
              {userInfo?.email || "-"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
            className="gap-1.5 min-h-[44px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Keluar Sesi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
