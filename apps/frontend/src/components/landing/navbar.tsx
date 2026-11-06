"use client";

import Link from "next/link";
import { Logomark } from "@/components/layout/logomark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logomark className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-foreground leading-none">
              NutriSnap
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              AI Bulking & Diet
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              Masuk
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="gap-1.5 shadow-sm">
              Mulai Sekarang
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

