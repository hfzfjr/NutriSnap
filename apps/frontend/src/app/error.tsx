"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logomark } from "@/components/layout/logomark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log galat ke console client secara aman tanpa mengekspos token/kredensial
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4">
        <Logomark className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Terjadi Kendala</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Aplikasi mengalami kendala saat memproses halaman ini. Silakan coba lagi
        atau kembali ke Dashboard utama.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Kode referensi: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button size="sm" onClick={() => reset()}>
          Coba Lagi
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Ke Dashboard
        </Button>
      </div>
    </div>
  );
}
