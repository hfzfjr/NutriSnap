import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logomark } from "@/components/layout/logomark";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4">
        <Logomark className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <h2 className="mt-1 text-lg font-semibold text-foreground">
        Halaman tidak ditemukan
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Halaman yang kamu cari mungkin telah dipindahkan atau tautan yang kamu
        buka kurang tepat.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button size="sm">Kembali ke Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm">
            Halaman Depan
          </Button>
        </Link>
      </div>
    </div>
  );
}
