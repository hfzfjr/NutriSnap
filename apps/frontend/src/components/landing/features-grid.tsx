import {
  BotMessageSquare,
  Camera,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    title: "AI Food Photo Scanner",
    desc: "Cukup jepret piring makan kamu. Multimodal AI Gemini mengidentifikasi makanan lokal Indonesia dan menghitung estimasi kalori serta gram protein dalam hitungan detik.",
    tag: "Gemini Vision",
  },
  {
    icon: TrendingUp,
    title: "Target Kalori & Protein Personal",
    desc: "Kalkulasi berbasis sains dengan rumus Mifflin-St Jeor. Menghitung BMR, TDEE, serta kebutuhan surplus kalori (bulking) atau defisit terukur (cutting) secara akurat.",
    tag: "BMR & TDEE",
  },
  {
    icon: BotMessageSquare,
    title: "Coach AI Kontekstual",
    desc: "Asisten nutrisi yang otomatis mengetahui sisa jatah kalori dan protein kamu hari ini. Tanyakan rekomendasi camilan malam, menu tinggi protein, atau strategi makan mingguan.",
    tag: "Chat Assistant",
  },
  {
    icon: Lock,
    title: "Keamanan BYOK Vault",
    desc: "Kunci Google Gemini API kamu dienkripsi menggunakan AES-256-GCM dengan kunci master server. Tidak pernah disimpan di browser dan tidak pernah bocor ke pihak ketiga.",
    tag: "Privasi Mandiri",
  },
];

export function LandingFeaturesGrid() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30 border-y border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            <Zap className="h-3.5 w-3.5" />
            Keunggulan Utama
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Semua yang Kamu Butuhkan untuk Mencapai Target Tubuh
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dibangun dengan pendekatan mobile-first PWA yang cepat, hemat kuota,
            dan mengutamakan privasi data nutrisi kamu.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground rounded-full bg-secondary px-2.5 py-0.5">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

