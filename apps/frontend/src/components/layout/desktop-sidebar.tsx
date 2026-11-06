"use client";

import * as React from "react";
import {
  BotMessageSquare,
  Camera,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logomark } from "@/components/layout/logomark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { apiFetch, clearStoredAuthToken } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/log", label: "Catat Makanan", icon: Camera },
  { href: "/analytics", label: "Progres & Target", icon: TrendingUp },
  { href: "/chat", label: "Coach AI", icon: BotMessageSquare },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [apiKeyStatus, setApiKeyStatus] = React.useState<{
    hasKey: boolean;
    isValid: boolean;
    keyHint?: string;
  } | null>(null);
  const [user, setUser] = React.useState<{
    name: string | null;
    email: string;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    apiFetch<{ hasKey: boolean; isValid: boolean; keyHint?: string }>(
      "/apikey/status"
    )
      .then((res) => {
        if (isMounted) setApiKeyStatus(res);
      })
      .catch(() => {});

    apiFetch<{
      user: { id: string; name: string | null; email: string };
    }>("/auth/me")
      .then((res) => {
        if (isMounted && res.user) setUser(res.user);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Abaikan jika jaringan gagal
    } finally {
      clearStoredAuthToken();
      router.push("/login");
    }
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card/85 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logomark className="h-7 w-7 text-primary" />
          <div>
            <span className="text-base font-bold tracking-tight text-foreground font-display">
              NutriSnap
            </span>
            <span className="block text-[10px] text-muted-foreground leading-tight">
              AI Bulking & Diet
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigasi Utama">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info: Live API Key & User Profile */}
      <div className="p-3 border-t border-border space-y-2.5">
        {/* Real BYOK Status */}
        <Link
          href="/settings"
          className="block rounded-xl border border-border bg-secondary/60 p-2.5 transition-colors hover:bg-secondary"
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Gemini BYOK
            </span>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                apiKeyStatus?.hasKey && apiKeyStatus?.isValid
                  ? "bg-status-ontrack"
                  : "bg-status-under"
              )}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {apiKeyStatus?.hasKey && apiKeyStatus?.isValid
              ? `Aktif (${apiKeyStatus.keyHint || "Tersimpan"})`
              : "Belum diatur — klik untuk pasang"}
          </p>
        </Link>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center justify-between rounded-xl p-2 text-xs">
            <div className="min-w-0 pr-2">
              <p className="font-semibold text-foreground truncate">
                {user.name || "Pengguna"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors"
              title="Keluar dari akun"
              aria-label="Keluar dari akun"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
