"use client";

import {
  BotMessageSquare,
  Camera,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/analytics", label: "Progres", icon: TrendingUp },
  { href: "/log", label: "Catat", icon: Camera, isPrimaryAction: true },
  { href: "/chat", label: "Coach", icon: BotMessageSquare },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Menu Bawah"
      className="fixed bottom-0 inset-x-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-background/90 backdrop-blur-xl border-t border-border md:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-center max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimaryAction) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <Link
                  href={item.href}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
                  aria-label="Catat atau Scan Makanan Baru"
                >
                  <Icon className="h-6 w-6" />
                </Link>
                <span className="mt-1 text-[10px] font-semibold text-primary">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 min-h-[44px] text-xs font-medium transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
