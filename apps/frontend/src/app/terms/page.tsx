import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logomark } from "@/components/layout/logomark";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan serta penafian medis penggunaan layanan NutriSnap.",
};

export default function TermsPage() {
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
            <FileText className="h-3.5 w-3.5" />
            Ketentuan Layanan
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Syarat & Ketentuan NutriSnap
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Terakhir diperbarui: 6 November 2026
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              1. Penafian Medis & Nutrisi (Medical Disclaimer)
            </h2>
            <div className="rounded-xl border border-status-under/40 bg-status-under/10 p-3.5 text-foreground font-medium">
              Informasi kalori, makronutrisi, BMR, TDEE, serta saran AI yang
              disajikan oleh NutriSnap hanya bersifat edukasi dan panduan gaya
              hidup umum. NutriSnap BUKAN pengganti saran, diagnosis, atau
              perawatan medis dari dokter atau ahli gizi terdaftar.
            </div>
            <p>
              Jika kamu memiliki kondisi kesehatan khusus seperti diabetes,
              gangguan ginjal, hipertensi, kehamilan, atau riwayat gangguan
              makan (*eating disorder*), selalu konsultasikan rencana diet dengan
              tenaga medis profesional sebelum melakukan pembatasan kalori atau
              perubahan pola makan drastis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              2. Penggunaan Kunci API Google Gemini (BYOK)
            </h2>
            <p>
              Dengan menggunakan fitur analisis foto atau chatbot AI, kamu setuju
              untuk menggunakan kunci API resmi dari Google AI Studio. Kamu
              bertanggung jawab penuh atas kuota dan aktivitas yang terjadi pada
              kunci API pribadi kamu sesuai ketentuan Google Gemini API Terms of
              Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              3. Batasan Estimasi AI
            </h2>
            <p>
              Analisis visual terhadap foto makanan bergantung pada sudut foto,
              pencahayaan, dan perkiraan volume piring. Estimasi nutrisi yang
              dihasilkan adalah pendekatan matematis cerdas, bukan hasil uji
              laboratorium gizi. Pengguna dapat menyesuaikan berat gram manual
              untuk akurasi maksimal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">
              4. Perubahan Ketentuan
            </h2>
            <p>
              Kami dapat memperbarui syarat dan ketentuan ini dari waktu ke waktu.
              Penggunaan berkelanjutan atas aplikasi setelah pembaruan menandakan
              persetujuan kamu terhadap ketentuan yang diperbarui.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border">
          <Link href="/login">
            <Button size="sm">Saya Mengerti & Lanjut ke Aplikasi</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

