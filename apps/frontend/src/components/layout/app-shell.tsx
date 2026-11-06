"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Halaman publik/mandiri yang tidak menampilkan sidebar & bottom nav internal aplikasi
  const isPublicOrStandalone =
    pathname === "/" || pathname === "/login" || pathname === "/onboarding";

  if (isPublicOrStandalone) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors">
      <DesktopSidebar />

      {/* Mobile Sticky Top Header (<768px) untuk halaman internal */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">NutriSnap</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 md:pl-64 pb-24 md:pb-8">
        <div className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-6">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

