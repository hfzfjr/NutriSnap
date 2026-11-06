"use client";

import {
  BotMessageSquare,
  Camera,
  Flame,
  KeyRound,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "AI Scan & Log Meal", icon: Camera },
  { href: "/chat", label: "AI Bulking & Diet Coach", icon: BotMessageSquare },
  { href: "/analytics", label: "Weight & Macro Stats", icon: TrendingUp },
  { href: "/settings", label: "Settings & BYOK Key", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">NutriSnap</span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              AI Bulking & Diet PWA
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 space-y-1.5 px-3 py-4">
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
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-xl bg-secondary/70 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Gemini BYOK Vault
            </span>
            <Badge variant="default">AES-256-GCM</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            API Key pribadi Anda dienkripsi penuh di server Coolify.
          </p>
        </div>
      </div>
    </aside>
  );
}

