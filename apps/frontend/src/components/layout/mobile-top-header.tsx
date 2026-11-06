"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Logomark } from "@/components/layout/logomark";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Beranda",
  "/log": "Catat Makanan",
  "/chat": "Coach AI",
  "/analytics": "Progres Tubuh",
  "/settings": "Pengaturan",
};

export function MobileTopHeader() {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] ?? "NutriSnap";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Logomark className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-tight">{title}</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

