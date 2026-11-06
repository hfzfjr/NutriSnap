"use client";

import Link from "next/link";
import { ArrowRight, Calculator, Camera, Lock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Decorative gradient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pelacak Nutrisi AI Generasi Baru</span>
        </div>

        {/* Headline */}
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
          Bebas Repot Hitung Kalori & Protein{" "}
          <span className="text-primary underline decoration-primary/30 underline-offset-8">
            Dari Foto Makanan
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg text-pretty">
          Cukup foto piring makanmu. AI Google Gemini menganalisis menu lokal
          Indonesia secara cerdas, menghitung kalori dan gram protein otomatis
          sesuai target bulking atau cutting kamu — aman dengan kunci API pribadi
          (BYOK).
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 text-base font-semibold shadow-md">
              <Camera className="h-5 w-5" />
              Mulai Gratis — Masuk Akun
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#calculator" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Coba Kalkulator Nutrisi
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 text-left">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Scan Cepat & Terkompresi
              </h4>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Kompresi gambar di browser hemat kuota & analisa &lt; 3 detik.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Keamanan BYOK Mandiri
              </h4>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Kunci Gemini API dienkripsi AES-256-GCM langsung di server pribadi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-ontrack/15 text-status-ontrack">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Katalog Menu Nusantara
              </h4>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Mengenali nasi uduk, dada ayam bakar, tahu tempe, telur, dan pecel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

