"use client";

import { Camera, CheckCircle2, Flame, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { API_BASE_URL, apiFetch, setStoredAuthToken } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleGoogleRedirect = () => {
    setIsLoading(true);
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

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
          googleId: "google-oauth-raka-101",
          email: "raka@nutrisnap.app",
          name: "Raka Pratama",
        }),
      });
      setStoredAuthToken(result.token);
      router.push(result.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <Card className="w-full max-w-md border-border/90 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Flame className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <Badge variant="default" className="mx-auto">
              AI Nutrition, Bulking & Diet PWA
            </Badge>
            <CardTitle className="text-2xl font-bold tracking-tight pt-1">
              Masuk ke NutriSnap
            </CardTitle>
            <CardDescription className="text-sm">
              Lacak kalori, protein, dan status surplus/defisit Anda dengan Google Gemini Multimodal.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full font-semibold gap-2.5"
            onClick={handleGoogleRedirect}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.25 5 12c0-3.25 3.36-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            Continue with Google OAuth
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full text-xs font-medium"
            onClick={handleQuickSignIn}
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Masuk Cepat (Mode Demo / Local Dev)
          </Button>

          <div className="rounded-xl bg-secondary/50 p-3.5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Keamanan Privasi & BYOK
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Enkripsi Gemini API Key dengan standar AES-256-GCM.
              </li>
              <li className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                Kompresi gambar otomatis di perangkat sebelum scan AI.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

