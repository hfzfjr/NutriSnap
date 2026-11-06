"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Logomark } from "@/components/layout/logomark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  API_BASE_URL,
  apiFetch,
  getStoredAuthToken,
  setStoredAuthToken,
} from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [existingUser, setExistingUser] = React.useState<{
    name: string;
    email: string;
  } | null>(null);

  // Periksa apakah ada error OAuth atau redirect tujuan
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "oauth_cancelled") {
          setErrorMsg("Proses login dengan Google dibatalkan.");
        } else if (err === "token_exchange_failed" || err === "no_access_token") {
          setErrorMsg("Gagal menukar token dengan Google. Silakan coba lagi.");
        } else {
          setErrorMsg("Terjadi kendala saat login dengan Google. Silakan coba lagi.");
        }
      }
    }

    const token = getStoredAuthToken();
    if (token) {
      void apiFetch<{ user: { name: string; email: string } }>("/auth/me")
        .then((res) => {
          setExistingUser(res.user);
        })
        .catch(() => {
          // Token tidak valid/kadaluarsa
        });
    }
  }, []);

  const handleGoogleRedirect = () => {
    setIsLoading(true);
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Mode Demo hanya tampil bila variabel lingkungan mengizinkan secara eksplisit pada mode development
  const isDemoLoginAllowed =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

  const handleQuickSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await apiFetch<{
        token: string;
        onboardingCompleted: boolean;
      }>("/auth/google/token", {
        method: "POST",
        body: JSON.stringify({
          googleId: "local-dev-account-01",
          email: "dev@nutrisnap.local",
          name: "Pengguna Dev",
        }),
      });
      setStoredAuthToken(result.token);

      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next") || (result.onboardingCompleted ? "/dashboard" : "/onboarding");
      router.push(nextPath);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal masuk mode demo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda</span>
        </Link>

        <Card className="shadow-xs border-border">
          <CardHeader className="space-y-3 text-center">
            <Link href="/" className="inline-block mx-auto">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-105">
                <Logomark className="h-6 w-6" />
              </div>
            </Link>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Masuk ke NutriSnap
              </CardTitle>
              <CardDescription className="text-sm">
                Catat kalori dan protein dari foto makananmu.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {existingUser && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    Sesi Aktif Ditemukan
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Kamu saat ini masuk sebagai{" "}
                  <strong className="text-foreground">{existingUser.name}</strong> (
                  {existingUser.email}).
                </p>
                <Link href="/dashboard" className="block pt-1">
                  <Button size="sm" className="w-full gap-2 h-10">
                    Lanjut ke Beranda
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Tombol Google Standar Resmi */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full font-semibold gap-3 h-12 bg-card hover:bg-muted text-foreground border-border shadow-xs"
              onClick={handleGoogleRedirect}
              disabled={isLoading}
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Lanjut dengan Google</span>
            </Button>

            {isDemoLoginAllowed && (
              <Button
                type="button"
                variant="secondary"
                className="w-full text-xs font-medium h-10 border border-dashed border-border"
                onClick={handleQuickSignIn}
                disabled={isLoading}
              >
                Masuk Cepat (Hanya Development)
              </Button>
            )}

            <div className="rounded-xl bg-muted/40 p-3.5 space-y-2 text-xs text-muted-foreground border border-border">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span>Privasi Akun & Data</span>
              </div>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-ontrack shrink-0" />
                  <span>Kami hanya memakai akun Google untuk masuk dengan aman.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-ontrack shrink-0" />
                  <span>API key Gemini-mu disimpan terenkripsi di server.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
