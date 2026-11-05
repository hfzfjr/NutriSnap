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
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/analytics", label: "Stats", icon: TrendingUp },
  { href: "/log", label: "Scan / Log", icon: Camera, isPrimaryAction: true },
  { href: "/chat", label: "AI Coach", icon: BotMessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-50 h-16 pb-[env(safe-area-inset-bottom)] bg-background/85 backdrop-blur-xl border-t border-border md:hidden"
    >
      <div className="grid h-full grid-cols-5 items-center max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/");

          if (item.isPrimaryAction) {
            return (
              <div key={item.href} className="flex flex-col items-center justify-center">
                <Link
                  href={item.href}
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
                  aria-label="Scan atau Catat Makanan"
                >
                  <Icon className="h-6 w-6" />
                </Link>
                <span className="mt-0.5 text-[11px] font-semibold text-primary">
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
                "flex flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

