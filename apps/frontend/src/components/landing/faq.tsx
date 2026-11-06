import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Apakah NutriSnap gratis digunakan?",
    a: "Ya, aplikasi ini gratis digunakan. Kamu hanya memerlukan akun Google dan kunci Google Gemini API pribadi (BYOK) yang bisa didapatkan secara cuma-cuma melalui Google AI Studio.",
  },
  {
    q: "Apa itu sistem BYOK (Bring Your Own Key)?",
    a: "Sistem BYOK berarti kamu menggunakan kuota Gemini API milikmu sendiri. Server NutriSnap mengenkripsi kunci tersebut dengan standar militer AES-256-GCM. Kami tidak menjual langganan bulanan dan tidak memungut biaya penggunaan API.",
  },
  {
    q: "Apakah foto makanan saya disimpan dan disebarkan ke publik?",
    a: "Tidak. Foto piring makanan dikompresi langsung di browsermu sebelum diunggah ke backend, lalu dianalisis oleh Gemini Vision secara privat. Kami tidak menjual data pengguna maupun foto makanan kepada pihak ketiga.",
  },
  {
    q: "Bagaimana cara memasang NutriSnap di HP (iOS & Android)?",
    a: "NutriSnap dibangun sebagai Progressive Web App (PWA). Di Android (Chrome), klik tombol 'Pasang' yang muncul di layar. Di iPhone (Safari), tekan tombol 'Bagikan' (Share) lalu pilih 'Tambah ke Layar Utama' (Add to Home Screen).",
  },
  {
    q: "Seberapa akurat AI dalam membaca menu masakan khas Indonesia?",
    a: "AI Google Gemini dilatih dengan pemahaman multimodal global yang kuat, termasuk menu nusantara seperti Nasi Padang, Dada Ayam Panggang, Tempe Orek, Sayur Asem, dan Telur Balado. Selain itu, kamu selalu bisa mengedit takaran gram secara manual jika ada penyesuaian porsi.",
  },
];

export function LandingFaq() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            Tanya Jawab
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Jawaban lengkap seputar cara kerja, privasi, dan model lisensi NutriSnap.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-border bg-card p-4 transition-colors open:border-primary/40 open:bg-card/90"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
                <span>{faq.q}</span>
                <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground transition-transform group-open:rotate-180">
                  ↓
                </span>
              </summary>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

