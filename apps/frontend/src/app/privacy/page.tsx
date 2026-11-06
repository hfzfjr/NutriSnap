import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Logomark } from "@/components/layout/logomark";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi dan komitmen keamanan data pengguna di NutriSnap.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
        <Link href="/">
          <Logomark className="h-7 w-7 text-primary" />
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            <Shield className="h-3.5 w-3.5" />
            Privasi & Keamanan Data
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Kebijakan Privasi NutriSnap
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Terakhir diperbarui: 6 November 2026
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              1. Komitmen Utama Kami
            </h2>
            <p>
              NutriSnap dirancang dengan filosofi privasi mandiri (*Privacy by
              Design*). Kami tidak menjual data pengguna, tidak menaruh pelacak
              iklan pihak ketiga, dan tidak menggunakan foto makanan kamu untuk
              tujuan komersial selain pemrosesan nutrisi yang kamu minta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              2. Data yang Dikumpulkan
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Data Autentikasi:</strong> Nama dan alamat email yang
                diberikan secara resmi melalui integrasi Google OAuth.
              </li>
              <li>
                <strong>Data Profil Nutrisi:</strong> Jenis kelamin, usia, tinggi
                badan, berat badan saat ini, target berat badan, dan preferensi
                aktivitas untuk menghitung BMR dan TDEE.
              </li>
              <li>
                <strong>Catatan Makan & Foto:</strong> Foto piring makan yang kamu
                unggah untuk dianalisis oleh AI serta log makanan manual.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              3. Keamanan Bring Your Own Key (BYOK)
            </h2>
            <p>
              Kunci Google Gemini API yang kamu daftarkan dienkripsi menggunakan
              algoritma kriptografi standar industri <strong>AES-256-GCM</strong>{" "}
              dengan IV unik dan disimpan secara terisolasi di database server.
              Kunci API asli tidak pernah dikirimkan kembali ke peramban (browser)
              dan tidak pernah dicatat pada log server.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              4. Pemrosesan Gambar Makanan
            </h2>
            <p>
              Gambar makanan dikompresi di sisi klien sebelum diunggah ke backend
              dan dikirim secara aman ke Google Gemini API hanya untuk keperluan
              ekstraksi nilai gizi. Foto tidak dibagikan ke pengguna lain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              5. Hak dan Kontrol Pengguna
            </h2>
            <p>
              Kamu memiliki kendali penuh atas datamu. Kamu dapat menghapus riwayat
              makan, memperbarui kunci API, atau menghapus kunci API yang tersimpan
              kapan saja melalui menu Pengaturan.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border">
          <Link href="/login">
            <Button size="sm">Mulai Gunakan NutriSnap</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

