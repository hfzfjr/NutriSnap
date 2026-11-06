"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileTopHeader } from "@/components/layout/mobile-top-header";
import { InstallBanner } from "@/components/pwa/install-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Halaman publik tanpa otentikasi dan tanpa shell internal
  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms";

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        {children}
      </div>
    );
  }

  // Halaman Onboarding membutuhkan otentikasi tetapi tanpa sidebar/bottom nav
  if (pathname === "/onboarding") {
    return (
      <AuthGate>
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
          {children}
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors">
        <DesktopSidebar />

        {/* Mobile Sticky Top Header (<768px) untuk halaman internal */}
        <MobileTopHeader />

        <main className="flex-1 md:pl-64 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-6">
            {children}
          </div>
        </main>

        <InstallBanner />
        <BottomNav />
      </div>
    </AuthGate>
  );
}
