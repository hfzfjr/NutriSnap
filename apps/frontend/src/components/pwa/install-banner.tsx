"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Logomark } from "@/components/layout/logomark";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Registrasi service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Cek apakah sudah standalone
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        sessionStorage.getItem("nutrisnap_install_dismissed") === "true")
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsVisible(false);
      }
    } catch {
      // Abaikan jika ditolak
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nutrisnap_install_dismissed", "true");
    }
  };

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-primary/30 bg-card p-3.5 shadow-xl md:bottom-6 md:left-auto md:right-6 md:w-96">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Logomark className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-foreground">
            Pasang NutriSnap di Layar Utama
          </h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
            Akses cepat tanpa browser, responsif kamera langsung, dan siap
            mencatat nutrisi harian kamu.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => void handleInstall()}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Pasang Sekarang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Nanti Saja
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Tutup banner instalasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

