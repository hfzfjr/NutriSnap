import Link from "next/link";
import { Logomark } from "@/components/layout/logomark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logomark className="h-8 w-8 text-primary" />
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                NutriSnap
              </span>
              <p className="text-xs text-muted-foreground">
                Pelacak nutrisi, kalori, dan protein berbasis AI Google Gemini.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Syarat & Ketentuan
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Masuk Akun
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center sm:text-left text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} NutriSnap. Informasi gizi yang
            dihasilkan AI adalah panduan nutrisi umum, bukan pengganti konsultasi
            medis profesional.
          </p>
        </div>
      </div>
    </footer>
  );
}

