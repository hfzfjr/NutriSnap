"use client";

import {
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  Target,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PwaPushReminderCard } from "@/components/pwa/pwa-manager";
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
import { apiFetch, setStoredAuthToken } from "@/lib/api-client";

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
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
  } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = React.useState<{
    name: string;
    email: string;
  } | null>(null);
  const [profile, setProfile] = React.useState<ProfileSummary["profile"]>(null);

  React.useEffect(() => {
    void apiFetch<{
      user: { name: string; email: string };
    }>("/auth/me")
      .then((res) => setUserInfo(res.user))
      .catch(() => {});

    void apiFetch<ProfileSummary>("/profile")
      .then((res) => setProfile(res.profile))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Abaikan jika sudah logout
    }
    setStoredAuthToken(null);
    router.push("/login");
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Badge variant="outline" className="mb-1.5 gap-1.5">
            <Settings className="h-3.5 w-3.5 text-primary" />
            Pusat Kendali Akun & Keamanan
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Pengaturan & BYOK Vault
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kunci Gemini AI terenkripsi, jadwal pengingat makan, target
            kalori, dan preferensi tema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Keluar Sesi
          </Button>
        </div>
      </div>

      {/* Ringkasan Profil & Target Nutrisi */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Profil Fisik & Target Kalori Harian
              </CardTitle>
              <CardDescription>
                {userInfo
                  ? `${userInfo.name} (${userInfo.email})`
                  : "Kalkulasi otomatis berbasis rumus Mifflin-St Jeor"}
              </CardDescription>
            </div>
            <Link href="/onboarding">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserCheck className="h-4 w-4" />
                Ubah Target Berat / Kalori
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Mode Program</p>
                <p className="mt-1 text-base font-bold uppercase text-primary">
                  {profile.goalType}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Berat Saat Ini → Target
                </p>
                <p className="mt-1 font-mono text-base font-bold">
                  {profile.currentWeightKg} kg → {profile.targetWeightKg} kg
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Target Kalori Harian
                </p>
                <p className="mt-1 font-mono text-base font-bold">
                  {profile.targetDailyCalories} kkal
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Target Makro (P / C / F)
                </p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  {profile.targetProteinG}g / {profile.targetCarbsG}g /{" "}
                  {profile.targetFatG}g
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Anda belum melengkapi profil fisik dan target berat badan.
              </p>
              <Link href="/onboarding">
                <Button size="sm">Mulai Onboarding Sekarang</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BYOK Gemini API Key Vault (AES-256-GCM) */}
      <ByokKeyCard />

      {/* PWA Push Notification Meal Reminders */}
      <PwaPushReminderCard />

      {/* Preferensi Tampilan & Keamanan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Tema Antarmuka & Privasi Data
          </CardTitle>
          <CardDescription>
            Dukungan penuh Light Mode dan Dark Mode serta enkripsi server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-ontrack" />
            <span>
              Seluruh komunikasi antara Frontend dan Backend berjalan di dalam
              jaringan internal Coolify. Kunci Gemini API Anda tidak pernah
              disimpan di <code>localStorage</code> browser.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Mode Tema:</span>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
