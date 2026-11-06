# REFACTOR.md — Perbaikan UI/UX, Konten & Data NutriSnap (`apps/frontend`)

> **Penulis:** UI/UX Auditor & Analyst · **Tanggal audit:** 2026-11-06
> **Pembaca utama:** AI coding agent (Antigravity) dan developer.
> **Status:** `TODO` — dikerjakan sebagai **Sprint 6** (lihat `docs/PROGRESS_TRACKER.md`).
> **Dokumen terkait yang ikut direvisi:** `docs/DESIGN.md` (v1.1) dan `docs/PRD.md` (v1.1). Jika ada konflik, urutan otoritas: `PRD.md` → `DESIGN.md` → dokumen ini → kode lama.

---

## 0. Cara Memakai Dokumen Ini

1. Baca `AGENTS.md`, `docs/PRD.md` (v1.1), `docs/DESIGN.md` (v1.1) lebih dulu.
2. Kerjakan **berurutan per Fase** (Fase 0 → 10). Jangan lompat; Fase 0 menutup masalah keamanan dan data palsu.
3. Satu fase = satu commit/branch (`refactor/phase-N-<nama>`). Tandai `IN_PROGRESS` / `DONE` di `docs/PROGRESS_TRACKER.md` sesuai `AGENTS.md` §5.
4. Setiap fase selesai hanya jika `pnpm typecheck && pnpm build` lulus **dan** checklist "Selesai bila" fase itu terpenuhi.
5. **Dilarang** menambah data contoh/dummy ke kode produksi. Contoh data hanya boleh di (a) landing page dengan label "Contoh tampilan", (b) test.
6. Batasan audit: `apps/backend` dan isi `packages/shared/src/nutrition.ts` **tidak sempat dibaca** (koneksi MCP timeout). Item bertanda ⚠️ **VERIFIKASI** wajib dicek agent sebelum dikerjakan.

---

## 1. Ringkasan Temuan Audit

### 1.1 Mengapa terasa "AI slop" dan "kurang srek"

| # | Gejala | Bukti di kode | Akar masalah |
|---|--------|---------------|--------------|
| S1 | Palet pelangi tanpa cerita | `emerald`, `indigo`, `amber`, `rose`, `cyan`, `violet`, `blue` dipakai bersamaan; di-hardcode (`text-indigo-500`, `bg-cyan-500/15`) di hampir semua halaman | 7 warna default Tailwind. Tidak ada satu warna pun yang terasa "milik NutriSnap". Warna status (cyan/violet/biru) bersaing dengan warna makro (indigo/amber/rose) |
| S2 | Dingin & generik untuk produk makanan | Latar `slate`/navy, `defaultTheme="dark"`, ikon `Flame` sebagai logo | Tema fintech/dev-tool diterapkan ke aplikasi makanan |
| S3 | Template landing yang sudah umum | Chip "NutriSnap 2.0 • …", blob blur `bg-primary/15 blur-3xl`, 4 kartu ikon-di-kotak-berwarna, 3 kartu bernomor, kartu "vault" palsu | Struktur dan dekorasi stok; tidak ada gambar produk nyata |
| S4 | Jargon teknis di depan pengguna | "AES-256-GCM", "Mifflin-St Jeor", "Multimodal", "BYOK Zero-Plaintext", "`@nutrisnap/shared`", "server Fastify", "Blueprint" | Teks ditulis untuk developer, bukan untuk Raka/Sinta/Dimas |
| S5 | Klaim berlebihan / tak terverifikasi | "standar militer", "Formula Medis Akurat", "mendeteksi … secara akurat", "Scan < 3 Detik", "ribuan request per hari tanpa biaya", "NutriSnap 2.0" | Hasil AI adalah estimasi; kuota Google bisa berubah |
| S6 | Bahasa campur tak konsisten | Nav: "Home / Stats / Settings"; judul: "Dashboard Harian"; satuan: "kcal" vs "kkal"; "Sisa Target" vs "Surplus"; `goalType.toUpperCase()` → "BULKING" | Tidak ada glossary dan aturan suara (voice) |
| S7 | Teks terlalu kecil | `text-[10px]`, `text-[11px]` untuk info utama; tombol `sm` = 36 px, tombol tanggal `h-8` | Melanggar prinsip DESIGN (body 14 px, touch target 44 px) |
| S8 | Kartu bersarang dan monoton | Kartu di dalam kartu (`bg-secondary/50` di dalam `Card`), 4 kartu waktu makan identik | Hirarki dibangun dari kotak, bukan dari ukuran/spasi |

### 1.2 Data dummy & konten tidak jelas (inti keluhan)

| ID | File | Temuan | Sev |
|----|------|--------|-----|
| D1 | `login`, `onboarding`, `dashboard`, `log`, `chat`, `analytics` | Jika tidak ada token, **setiap halaman membuat sesi otomatis** via `POST /auth/google/token` dengan `googleId` karangan dan akun `raka@nutrisnap.app`. Semua pengunjung berbagi satu akun demo; PRD US-01 (redirect ke `/login`) tidak terpenuhi | **P0** |
| D2 | `login/page.tsx` | Tombol "Masuk Cepat (Mode Demo / Local Dev)" tampil di produksi | **P0** |
| D3 | `onboarding/page.tsx` | Form diisi bawaan persona: `"Raka Pratama"`, 22 th, 172 cm, 58,5 kg, target 66 kg, 5 bulan. Pengguna baru bisa menekan "Lanjut" tanpa sadar menyimpan data orang lain | **P0** |
| D4 | `dashboard/page.tsx` | Fallback target palsu `2415 / 2800 / 120 g / 360 g / 78 g / +385` saat API gagal atau belum dimuat → tampil seolah data pengguna | **P0** |
| D5 | `analytics/page.tsx` | Fallback `58.5 kg`, `66.0 kg`, BMI `19.77`, `normal`, `2800`, `2415`; default input `59.0` | **P0** |
| D6 | `chat/page.tsx` | Fallback konteks `680 kcal` dan `35g Protein` tampil sebelum data dimuat | **P0** |
| D7 | `log/page.tsx` | Form manual terisi bawaan `150 g / 248 kcal / 46,5 g / 5,4 g` (nilai dada ayam) padahal nama makanan kosong → mudah tersimpan salah | **P0** |
| D8 | `pwa-manager.tsx` | Jika izin push ditolak/gagal, **langganan palsu** (`push.nutrisnap.local`, kunci karangan) dikirim ke backend dan UI menampilkan "berhasil diaktifkan" | **P0** |
| D9 | `desktop-sidebar.tsx` | Badge "Gemini BYOK Vault · AES-256-GCM" selalu tampil walau pengguna belum punya key (status palsu) | P1 |
| D10 | `page.tsx` (landing) | Panel "Vault Enkripsi Server" dengan `KeyHint: AIzaSy...9xQp` dan "Status: ENCRYPTED" hanyalah dekorasi; `Progress value={100}` protein tidak bermakna | P1 |
| D11 | `page.tsx` (landing) | `sampleConsumedCalories`, `sampleConsumedProtein`, `dailyStatus`, impor `evaluateDailySurplusDeficitStatus` dihitung tetapi **tidak dipakai**; `Bell` kemungkinan tidak dipakai (cek lint) | P2 |
| D12 | `page.tsx` footer | Tautan GitHub pribadi `hfzfjr/NutriSnap`, "Masuk Sesi", tautan Dashboard untuk pengunjung | P2 |

### 1.3 Bug fungsional / aksesibilitas yang ditemukan saat audit

| ID | Temuan | Dampak | Sev |
|----|--------|--------|-----|
| B1 | `new Date().toISOString().slice(0,10)` dipakai untuk "hari ini" di `dashboard`, `log`, `analytics` → **tanggal UTC**. Di WIB sebelum 07:00, "hari ini" = kemarin. Navigasi tanggal (`setDate` + `toISOString`) juga bergeser | Log makan pagi masuk ke hari salah | **P0** |
| B2 | `layout.tsx`: `maximumScale: 1` | Mematikan pinch-zoom; melanggar WCAG 1.4.4 | **P0** |
| B3 | `manifest.ts` merujuk `/icons/icon-192.png` & `icon-512.png`, tetapi `public/icons/` hanya berisi `icon.svg` | PWA tidak lolos installability; ikon 404 | **P0** |
| B4 | Kontras: `text-emerald-500`, `text-amber-500` di atas latar terang ≈ 2,1–2,5 : 1; `bg-primary` (#10B981) + teks putih ≈ 2,5 : 1 | Gagal WCAG AA padahal DESIGN §6 mengklaim lulus | **P0** |
| B5 | `bottom-nav.tsx`: `h-16` + `pb-[env(safe-area-inset-bottom)]` → inset *memakan* tinggi 64 px, bukan menambah; `main` memakai `pb-24` tetap | Ikon terpotong/sesak di iPhone berponi | P1 |
| B6 | `catch {}` kosong di dashboard, chat, analytics, settings | Gagal diam-diam; pengguna tidak tahu apa yang salah; pesan chat hilang saat gagal kirim | P1 |
| B7 | `onboarding` dari Settings ("Ubah Target") membuka wizard **tanpa memuat profil lama** | Profil tertimpa nilai bawaan | P1 |
| B8 | `log`: berat diubah setelah estimasi → makro tidak ikut berubah; edit berat item hasil scan menghitung ulang dari nilai yang sudah diskalakan (galat pembulatan menumpuk) | Angka tersimpan salah | P1 |
| B9 | `log`: PRD US-04 AC3 minta nama/kalori bisa diedit; saat ini hanya berat | Fitur kurang | P1 |
| B10 | `log`: `capture="environment"` memaksa kamera; tidak ada tombol "Galeri" (DESIGN §3.2) | Pengguna Android tidak bisa pilih dari galeri | P1 |
| B11 | `log`: tidak ada banner "API key belum diatur" (PRD US-02 AC3) | Pengguna baru tahu setelah gagal | P1 |
| B12 | `pwa-manager`: `reminderEnabled` ada di state tetapi **tidak ada Switch** di UI; zona waktu tidak bisa diatur; Service Worker hanya didaftarkan di halaman Settings; tidak ada Install Banner (PRD US-09) | Fitur tidak bisa dipakai sesuai spesifikasi | P1 |
| B13 | `chat`: balasan AI ditampilkan `whitespace-pre-line` (tanpa Markdown) padahal tracker mengklaim dukungan Markdown; tidak ada pesan optimistis | Tabel/daftar AI tampil mentah | P1 |
| B14 | `login`: ikon Google satu warna (`currentColor`) di tombol hijau; error OAuth (`?error=`) tidak ditampilkan | Tidak mengikuti panduan merek Google; error bisu | P2 |
| B15 | Label form tanpa `htmlFor`/`id`; `Progress` tanpa `role="progressbar"`; tombol panah tanggal tanpa `aria-label`; `CalorieRing` tanpa `role="img"` | A11y | P1 |
| B16 | Tidak ada `loading.tsx`, `error.tsx`, `not-found.tsx`; tidak ada guard rute (PRD US-01) | UX kosong saat memuat/gagal | P1 |
| B17 | Ambang `\|\| 22`, `\|\| 170`, `\|\| 60` di kalkulator (`landing`, `onboarding`) menyembunyikan input kosong/tidak valid dan menampilkan hasil seolah valid | Hasil menyesatkan | P1 |
| B18 | Aktivitas `very_active` ada di PRD §3.3 tetapi tidak ada di UI (hanya 4 opsi) | Tidak sesuai PRD | P2 |
| B19 | PRD US-03/§3.4: tombol penyesuaian ke rentang aman saat guardrail terpicu **belum ada** (hanya pesan teks) | Fitur kurang | P1 |
| B20 | Token auth di `localStorage` + dukungan `?token=` di URL (`api-client.ts`) | Token bocor via riwayat/referrer. Catatan: `nutrisnap.domain.com` dan `api-nutrisnap.domain.com` adalah **same-site**, jadi cookie `Domain=.domain.com; SameSite=Lax` seharusnya bekerja — **tinjau ulang premis BUG-003** | P1 ⚠️ |

---

## 2. Keputusan Desain Final (menggantikan DESIGN.md v1.0)

### 2.1 Arah visual: "Dapur Segar" (Warm Kitchen)

- **Karakter:** hangat, tenang, jelas. Bukan dashboard fintech, bukan "gym neon".
- **Satu warna merek:** hijau daun tua. Satu aksen hangat (kunyit) hanya untuk peringatan ringan dan karbohidrat.
- **Latar krem hangat**, kartu lebih terang dari latar, **tanpa glow, tanpa blob blur, tanpa gradient teks, tanpa bayangan berwarna**.
- **Hirarki lewat ukuran & spasi**, bukan kotak berlapis. Maksimal **1 tingkat kartu**; di dalam kartu pakai pemisah garis tipis atau jarak.
- **Radius:** kartu `rounded-xl` (12 px), tombol/input `rounded-lg` (10 px), chip `rounded-full`. Hentikan `rounded-2xl/3xl` di mana-mana.
- **Warna status tidak lagi cyan/ungu/biru.** Status = ikon + teks + 3 warna semantik (hijau on-track, kunyit under, cabai over). Jenis program (Bulking/Cutting/Maintenance) = chip netral berikon, **bukan** warna sendiri.

### 2.2 Token warna (salin ke `globals.css`, **HSL tanpa `hsl()`** agar kompatibel Tailwind)

```css
@layer base {
  :root {
    --background: 40 33% 97%;
    --foreground: 150 25% 12%;
    --card: 40 40% 99%;
    --card-foreground: 150 25% 12%;
    --popover: 40 40% 99%;
    --popover-foreground: 150 25% 12%;
    --primary: 152 55% 26%;
    --primary-foreground: 40 33% 97%;
    --secondary: 40 20% 93%;
    --secondary-foreground: 150 25% 12%;
    --muted: 40 20% 93%;
    --muted-foreground: 150 8% 38%;
    --accent: 150 30% 92%;
    --accent-foreground: 152 55% 20%;
    --destructive: 8 65% 45%;
    --destructive-foreground: 0 0% 100%;
    --border: 40 15% 86%;
    --input: 40 15% 80%;
    --ring: 152 55% 26%;
    --radius: 0.75rem;

    /* Makro (teks/ikon/bar). Kalori memakai --primary */
    --macro-protein: 222 60% 48%;
    --macro-carbs: 36 90% 30%;
    --macro-fat: 10 65% 42%;
    /* Status */
    --status-ontrack: 152 55% 26%;
    --status-under: 36 90% 30%;
    --status-over: 8 65% 45%;
  }

  .dark {
    --background: 150 14% 8%;
    --foreground: 40 20% 94%;
    --card: 150 12% 11%;
    --card-foreground: 40 20% 94%;
    --popover: 150 12% 13%;
    --popover-foreground: 40 20% 94%;
    --primary: 148 50% 58%;
    --primary-foreground: 150 40% 8%;
    --secondary: 150 10% 16%;
    --secondary-foreground: 40 20% 94%;
    --muted: 150 10% 16%;
    --muted-foreground: 150 8% 65%;
    --accent: 150 25% 18%;
    --accent-foreground: 148 50% 80%;
    --destructive: 8 75% 62%;
    --destructive-foreground: 150 40% 8%;
    --border: 150 10% 20%;
    --input: 150 10% 26%;
    --ring: 148 50% 58%;

    --macro-protein: 222 85% 76%;
    --macro-carbs: 40 90% 62%;
    --macro-fat: 10 80% 66%;
    --status-ontrack: 148 50% 58%;
    --status-under: 40 90% 62%;
    --status-over: 8 75% 62%;
  }
}
```

> Nilai di atas adalah titik awal. **Wajib** diverifikasi dengan skrip kontras (Fase 1.6). Jika ada pasangan < 4,5 : 1 (teks) atau < 3 : 1 (grafis), naikkan kegelapan/kecerahan token itu — jangan melonggarkan standar.

**Tambahkan ke `tailwind.config.ts` → `theme.extend.colors`:**

```ts
macro: {
  protein: "hsl(var(--macro-protein))",
  carbs: "hsl(var(--macro-carbs))",
  fat: "hsl(var(--macro-fat))",
},
status: {
  ontrack: "hsl(var(--status-ontrack))",
  under: "hsl(var(--status-under))",
  over: "hsl(var(--status-over))",
},
```

Pemakaian: `text-macro-protein`, `bg-macro-protein` (bar), `bg-macro-protein/10` (latar lembut), `text-status-over`.

**Aturan keras:** setelah Fase 1, **tidak boleh** ada `text-/bg-/border-` dengan palet bawaan Tailwind (`emerald|indigo|amber|rose|cyan|violet|blue|slate|sky|teal`) di `src/`. Tambahkan pemeriksaan:

```bash
grep -rEn "(text|bg|border|ring|from|to)-(emerald|indigo|amber|rose|cyan|violet|blue|slate|sky|teal)-[0-9]" apps/frontend/src && exit 1 || true
```

### 2.3 Tipografi

- **UI & angka:** `Plus Jakarta Sans` (tetap) + `tabular-nums` pada semua angka (kalori, gram, kg, persen, jam).
- **Display (hanya landing H1/H2 dan angka hero dashboard bila terlihat cocok):** `Fraunces` via `next/font/google` → variabel `--font-display`. Maksimal **2 keluarga font**. Hapus `JetBrains Mono` dari spesifikasi (tidak pernah dimuat; `font-mono` di Settings jatuh ke font sistem).
- **Skala minimum:** tidak ada teks < 12 px. Ganti semua `text-[10px]`/`text-[11px]` → `text-xs` (12 px) dan pastikan info utama ≥ `text-sm` (14 px). Teks bubble chat 14–15 px.

```ts
// layout.tsx
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["opsz"] });
```
```ts
// tailwind.config.ts → theme.extend
fontFamily: {
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  display: ["var(--font-display)", "Georgia", "serif"],
},
```

### 2.4 Bahasa & suara (voice)

- **Bahasa UI: Indonesia.** Kata serapan yang sudah lazim dipertahankan: *Bulking, Cutting, Maintenance, Protein, Kalori, Makro, Scan, API key*.
- **Sapaan: "kamu"** (persona 21–27 tahun). Hentikan "Anda".
- **Kalimat:** pendek, konkret, kata kerja di depan. Tidak ada superlatif tak terbukti. AI selalu disebut **estimasi**.
- **Jargon teknis** (AES-256-GCM, Mifflin-St Jeor, IV/Auth Tag, nama model) hanya boleh di blok "Detail teknis" yang dilipat, atau di `docs/`.
- **Satuan baku:** `kcal`, `g`, `kg`, `cm`. Tidak ada `kkal`.
- **Format angka & tanggal:** helper tunggal (lihat Fase 0.5). Ribuan dengan titik, desimal dengan koma di tampilan (`2.415 kcal`, `58,5 kg`); `<input type=number>` tetap titik.

**Glosarium (gunakan persis ini):**

| Konsep | Teks UI |
|---|---|
| Dashboard | Beranda |
| Scan / Log | Catat |
| AI Coach | Coach AI |
| Stats / Analytics | Progres |
| Settings | Pengaturan |
| Maintenance (TDEE) | Kalori maintenance |
| BMR | Kalori istirahat (BMR) |
| Surplus / Deficit | Surplus / Defisit |
| Over target | Melebihi target |
| Blueprint | Rencana harian |
| BYOK Vault | API key Gemini |
| AI Food Photo Scanner | Scan foto makanan |
| Manual Input | Ketik manual |
| Sarapan / Makan Siang / Makan Malam / Camilan | tetap |

### 2.5 Komponen baru / diubah (acuan Fase 1)

| Komponen | Spesifikasi singkat |
|---|---|
| `Label` + `Field` | `<Field label hint error>` membungkus `Input`; otomatis `id`/`htmlFor`/`aria-describedby`/`aria-invalid` |
| `Input`/`Textarea` | tinggi 44 px; `text-base md:text-sm`; varian `suffix` (kg, cm, g, kcal) |
| `Button` | tinggi min 44 px di mobile (`size="sm"` → `h-10`); prop `isLoading` (spinner `Loader2`); hapus `shadow-*` berwarna |
| `Badge` | Hapus `surplus/deficit/maintenance` berwarna. Varian: `default`, `outline`, `secondary`, `success`, `warning`, `danger` (semua dari token) |
| `StatusPill` | `<StatusPill tone="ontrack\|under\|over" icon label />` — selalu ikon + teks |
| `GoalChip` | chip netral: ikon `TrendingUp/TrendingDown/Minus` + "Bulking · +385 kcal/hari" |
| `MacroBar` | label, nilai/target, `role="progressbar"` + `aria-valuenow/min/max/label`; warna dari token makro |
| `Progress` | tambah ARIA di atas |
| `Skeleton` | blok `animate-pulse bg-muted`, hormati `prefers-reduced-motion` |
| `EmptyState` | ikon sederhana, 1 kalimat jelas, 1–2 CTA |
| `ConfirmDialog` / `Sheet` | `Dialog` di ≥768 px, bottom sheet di <768 px (Radix Dialog) |
| `Switch` | untuk pengingat; ukuran sentuh 44 px |
| `Toast` | `sonner`; dipakai untuk "tersimpan", "dihapus + Urungkan", error jaringan |
| `CalorieRing` | token warna, penanda TDEE, warna berubah saat melebihi, `role="img"` + `aria-label` ringkas |

---

## 3. Rencana Kerja per Fase

### Fase 0 — Hentikan data palsu & perbaiki yang berbahaya (P0)

**0.1 Hapus auto-login demo di frontend**
- Hapus semua blok `apiFetch("/auth/google/token", …googleId: "google-…")` di: `dashboard/page.tsx`, `log/page.tsx`, `chat/page.tsx`, `analytics/page.tsx`, `onboarding/page.tsx`.
- Hapus `handleQuickSignIn` dan tombol "Masuk Cepat (Mode Demo / Local Dev)" di `login/page.tsx`.
- Jika demo login masih dibutuhkan untuk dev: tampilkan hanya bila `process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"`, dan label jelas "Hanya development".
- ⚠️ **VERIFIKASI backend:** endpoint `POST /api/v1/auth/google/token` (menerbitkan token dari `googleId/email/name` kiriman klien) **harus dinonaktifkan di `NODE_ENV=production`** atau dilindungi secret. Tanpa itu siapa pun bisa membuat token untuk email mana pun. Laporkan hasil di `docs/BUGS.md`.

**0.2 `AuthGate` (menegakkan PRD US-01)**
- Buat `components/auth/auth-gate.tsx` (client): untuk rute non-publik, cek `getStoredAuthToken()` lalu `GET /auth/me`. Gagal → `router.replace("/login?next=<path>")`. Berhasil → cek `onboardingCompleted`/`GET /profile`; jika `profile === null` dan rute bukan `/onboarding` → `/onboarding`.
- Selama mengecek tampilkan skeleton halaman (bukan layar kosong).
- Pasang di `AppShell` untuk semua rute selain `/`, `/login`, `/privacy`, `/terms`. `/onboarding` butuh login tetapi tanpa sidebar.
- `login`: baca `?next=` dan `?error=`; tampilkan pesan error OAuth dalam bahasa manusia.

**0.3 `apiFetch` yang jujur**
- Tangani respons non-JSON tanpa melempar `SyntaxError`.
- Pada `401`: `setStoredAuthToken(null)` lalu arahkan ke `/login`.
- Lempar `ApiError { status, code, message }`; pesan default berbahasa Indonesia ("Tidak bisa terhubung ke server. Periksa koneksi internetmu.").
- Hapus dukungan `?token=` di URL kecuali benar-benar dipakai callback OAuth saat ini; jika dipakai, bersihkan URL **sebelum render** dan catat risikonya (B20).

**0.4 Hapus semua nilai fallback palsu** (D3–D7)
- `dashboard`: hapus objek `targets` bawaan. State: `loading` → skeleton; `error` → kartu error + tombol "Coba lagi"; `summary.targets` kosong/profil belum ada → CTA "Lengkapi profilmu" ke `/onboarding`.
- `analytics`: hapus `58.5/66/19.77/normal/2800/2415` dan default `59.0`. Input berat dimulai kosong dengan placeholder berisi berat terakhir.
- `chat`: hapus `680`/`35`. Header konteks tampil skeleton sampai data ada; jika gagal, sembunyikan angka.
- `log` manual: state awal `name: ""`, `weight: ""`, semua makro `""`. Tombol Simpan nonaktif sampai nama, berat, dan kalori valid.
- `onboarding`: semua field mulai kosong (`""`), nama diisi dari `GET /auth/me`. Tampilkan contoh hanya sebagai `placeholder` (mis. "mis. 170").

**0.5 Perbaiki tanggal (B1)** — buat `lib/date.ts`:
```ts
export function todayISO(tz?: string): string {
  const zone = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
```
Dan `lib/format.ts`: `formatNumber(n, maxFractionDigits = 0)` memakai `Intl.NumberFormat("id-ID")`; `formatKg`, `formatKcal`, `formatGram`. Ganti seluruh `new Date().toISOString().slice(0,10)`, `setDate(...)` di `dashboard`, `log`, `analytics`. Gunakan zona waktu dari profil bila ada. ⚠️ **VERIFIKASI** backend `/meals/daily` memakai `loggedDate` string (bukan timestamp UTC).

**0.6 Viewport & PWA dasar (B2, B3)**
- `layout.tsx`: hapus `maximumScale: 1`. Tambah `viewportFit: "cover"`.
- Buat ikon PNG: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180). Sumber: logomark baru (Fase 2.1). Jika belum ada logomark, ekspor dari `icon.svg` lalu ganti nanti.
- `manifest.ts`: `id: "/"`, `lang: "id"`, `scope: "/"`, `start_url: "/dashboard"`, `background_color` = nilai `--background` terang, `theme_color` = nilai `--primary` terang, ikon `any` dan `maskable` terpisah, `shortcuts: [{ name: "Catat makanan", url: "/log" }]`.
- `layout.tsx` metadata: `title: { default: "NutriSnap — Catat kalori & protein dari foto", template: "%s · NutriSnap" }`, `icons.apple`, `openGraph`, `defaultTheme="system"`. Karena halaman memakai `"use client"`, tambahkan metadata per rute lewat `layout.tsx` segmen.

**Selesai bila:** tidak ada string `raka@nutrisnap.app`/`google-…-user` di `src/`; membuka `/dashboard` tanpa login → `/login`; tidak ada angka bawaan di UI saat API gagal; "hari ini" benar pada pukul 00:30 WIB; pinch-zoom aktif; Lighthouse PWA installable.

---

### Fase 1 — Design tokens & primitif UI

1.1 Ganti `globals.css` dengan token §2.2; tambah:
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, ::before, ::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```
Gunakan kelas `tabular-nums` pada elemen angka (jangan memaksa `font-feature-settings` global bila mengubah bentuk huruf).

1.2 Perbarui `tailwind.config.ts` (warna `macro`/`status`, `fontFamily`, radius baru).
1.3 `layout.tsx`: dua font, `defaultTheme="system"`, `min-h-dvh`.
1.4 Refactor `components/ui/*` sesuai §2.5; tambah `label`, `field`, `textarea`, `skeleton`, `switch`, `dialog`/`sheet`, `status-pill`, `goal-chip`, `macro-bar`, `empty-state`. Tambah dependensi: `@radix-ui/react-dialog`, `@radix-ui/react-switch`, `sonner`.
1.5 **Sapu bersih warna hardcoded** (aturan §2.2) di seluruh `src/`. Peta ganti:

| Lama | Baru |
|---|---|
| `text-emerald-500`, `bg-emerald-500` | `text-primary`, `bg-primary` |
| `text-indigo-500`, `bg-indigo-500` | `text-macro-protein`, `bg-macro-protein` |
| `text-amber-500`, `bg-amber-500` | `text-macro-carbs`, `bg-macro-carbs` |
| `text-rose-500`, `bg-rose-500` | `text-macro-fat`, `bg-macro-fat` |
| `border-amber-500/40 bg-amber-500/10 text-amber-600` | `border-status-under/40 bg-status-under/10 text-status-under` |
| `text-emerald-600 dark:text-emerald-300` (sukses) | `text-status-ontrack` |
| `Badge variant="surplus/deficit/maintenance"` | `GoalChip` |

1.6 **Skrip kontras** `scripts/check-contrast.mjs`: parse `globals.css`, hitung rasio untuk pasangan: `foreground/background`, `card-foreground/card`, `primary-foreground/primary`, `muted-foreground/background`, `muted-foreground/card`, `macro-*` dan `status-*` di atas `background` & `card` (teks ≥ 4,5; grafis ≥ 3), di kedua tema. Tambahkan `"check:contrast"` ke `package.json`; gagal → exit 1.

**Selesai bila:** `pnpm check:contrast` lulus; grep warna hardcoded kosong; semua tombol/input ≥ 44 px pada <768 px; tidak ada `text-[10px|11px]`.

---

### Fase 2 — App shell & navigasi

2.1 **Logomark** sederhana (SVG): piring/lingkaran + sudut bidik kamera, satu warna `primary`. Ganti ikon `Flame` di header landing, sidebar, top bar mobile, login, footer. (Boleh sementara memakai `ScanLine` lucide bila logomark belum ada — tetapi **bukan** `Flame`.)
2.2 `bottom-nav.tsx`: label **Beranda, Progres, Catat, Coach, Pengaturan**; tinggi `h-[calc(4rem+env(safe-area-inset-bottom))]` + `pb-[env(safe-area-inset-bottom)]`; teks label `text-xs`; tombol tengah mendapat status aktif; `aria-current="page"`. `AppShell main`: `pb-[calc(5rem+env(safe-area-inset-bottom))]`.
2.3 `desktop-sidebar.tsx`: label sesuai glosarium (tanpa "AI Bulking & Diet Coach", "Weight & Macro Stats", "Settings & BYOK Key"). Ganti kartu "Gemini BYOK Vault" statis dengan **status nyata** dari `GET /apikey/status`: "API key aktif (AIza…7f9Q)" atau "API key belum diatur → Atur". Tambah blok profil (nama, email, tombol keluar) di bawah.
2.4 Top bar mobile: judul halaman aktif (bukan hanya logo) + indikator status API key (titik hijau/kunyit) + `ThemeToggle`. Satu `ThemeToggle` per layar; hapus duplikat di Settings (kini ada 3).
2.5 Tambah `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` (bahasa Indonesia, CTA kembali ke Beranda).
2.6 `PwaManager` global di `layout.tsx`: daftarkan `sw.js` sekali, dengarkan `beforeinstallprompt`, tampilkan `InstallBanner` (dismiss disimpan di `localStorage`, aman terhadap SSR); instruksi manual untuk iOS Safari ("Bagikan → Tambahkan ke Layar Utama").

**Selesai bila:** di iPhone mode standalone ikon nav tidak terpotong; halaman 404 dan error tampil rapi; install banner muncul sesuai kondisi.

---

### Fase 3 — Landing page (`src/app/page.tsx`) — tulis ulang

**Pecah** menjadi komponen di `components/landing/*` (`hero.tsx`, `calculator.tsx`, `how-it-works.tsx`, `features.tsx`, `api-key-explainer.tsx`, `faq.tsx`, `site-footer.tsx`). Hapus kode mati (D11). Struktur & teks final:

**A. Header** — logomark + "NutriSnap"; tautan: *Cara kerja · Hitung kalori · API key · FAQ*; tombol "Masuk" (atau "Buka Beranda" bila sudah login). Hapus chip "AI Bulking & Diet".

**B. Hero** (2 kolom ≥1024 px; mockup di atas teks pada mobile)
- Eyebrow: *Pencatat kalori & protein untuk bulking dan diet*
- H1 (`font-display`): **Foto makananmu. Kalori dan proteinnya langsung terhitung.**
- Sub: *NutriSnap menebak isi piringmu dari foto, lalu mencatat kalori dan makronya. Kamu tinggal cek, koreksi kalau perlu, dan simpan.*
- CTA utama: **Mulai dengan Google** (login) / **Buka Beranda** (sudah login). CTA kedua (teks/outline): **Hitung target kalorimu ↓**
- Catatan kecil: *Gratis. Fitur AI memakai API key Gemini milikmu sendiri.*
- **Mockup nyata**: render komponen `CalorieRing` + 2 baris makanan dengan data fiktif, diberi keterangan *"Contoh tampilan dengan data fiktif"*. Tanpa blob blur/glow.
- Di bawah hero: tiga fakta (tanpa kartu berwarna, cukup ikon monokrom + teks): *Estimasi dari foto, bisa kamu koreksi* · *Target dihitung dari data tubuhmu* · *Bisa dipasang di layar utama HP*.
- Hapus: chip "NutriSnap 2.0 …", empat kartu badge warna-warni, "Scan < 3 Detik".

**C. Cara kerja** — 3 langkah horizontal, angka besar bergaya `font-display`, tanpa kartu:
1. **Isi data tubuhmu** — *Usia, tinggi, berat, dan target. NutriSnap menghitung kebutuhan kalori dan protein harianmu.*
2. **Foto atau ketik makananmu** — *Foto piringmu, atau ketik nama makanan dan beratnya kalau kamu menimbang sendiri.*
3. **Lihat sisa target hari ini** — *Beranda menunjukkan sisa kalori dan protein. Coach AI bisa menyarankan menu untuk menutupnya.*

**D. Kalkulator** (pertahankan — ini bagian terbaik) — perbaikan:
- Judul: **Berapa kalori yang kamu butuhkan?** Sub: *Isi datamu, hasilnya langsung muncul. Tanpa perlu daftar.*
- Hapus teks "`@nutrisnap/shared`" dan "Algoritma klinis". Ganti: *Perkiraan umum, bukan saran medis.*
- Gunakan `Field` + label ber-`htmlFor`; field kosong = hasil tidak ditampilkan + pesan "Lengkapi usia, tinggi, dan berat" (hapus `|| 22` dkk, B17). Tambah aktivitas ke-5 `very_active`. Aktivitas ditampilkan sebagai `select`/radio ber-deskripsi, bukan 4 tombol kecil.
- Hasil: label **"Kalori istirahat (BMR)"**, **"Kalori maintenance"**, **"Target harian"**, **"Target protein"**; hapus `Progress value={100}`; tampilkan perubahan per minggu (mis. *+0,35 kg/minggu*) dan peringatan guardrail dengan teks jelas.
- CTA: **Simpan rencana ini** → simpan input ke `sessionStorage("nutrisnap:calc")` lalu ke `/login?next=/onboarding`; `onboarding` membaca & mengisi awal (lalu menghapusnya).

**E. Fitur** — *bento* asimetris (1 blok lebar + 2 blok), tiap blok berisi cuplikan UI nyata, bukan ikon:
- **Scan foto makanan** — cuplikan kartu hasil scan (3 item + total). *Hasil berupa estimasi. Koreksi nama, berat, atau kalori sebelum disimpan.*
- **Ketik manual** — cuplikan form nama + gram. *Menimbang sendiri? Ketik nama makanan dan beratnya; kalori dan makro dihitung otomatis.*
- **Coach AI** — cuplikan 2 gelembung chat. *Tanya "sisa 45 g protein, makan apa?" — Coach membaca sisa target harimu.*
- Hapus "25+ referensi makanan" kecuali angka itu dibaca dari data nyata.

**F. API key Gemini** (ganti total "Keamanan & Privasi Mutlak"):
- Judul: **Kenapa perlu API key Gemini?**
- Isi: *Fitur AI (baca foto dan Coach) berjalan lewat akun Google AI Studio milikmu. Jadi tidak ada langganan dari kami. Google menyediakan kuota gratis dengan batas tertentu — cek ketentuan terbarunya di Google AI Studio. Tanpa key pun kamu tetap bisa mencatat makanan secara manual.*
- 3 langkah: *Buka aistudio.google.com/app/apikey → Buat key → Tempel di Pengaturan.*
- Privasi (daftar 3 poin): *Key disimpan terenkripsi di server dan tidak pernah ditampilkan lagi.* · *Kamu bisa mengganti atau menghapusnya kapan saja.* · *Fitur manual tetap jalan tanpa key.*
- `<details>` **Detail teknis**: AES-256-GCM, IV 96-bit, auth tag 128-bit, didekripsi di memori server hanya saat memanggil Gemini.
- Hapus panel vault palsu, "standar militer", "server Fastify".

**G. FAQ** (semantic `<details>`, teks `text-sm`):
1. **Apakah NutriSnap gratis?** — *NutriSnap gratis. Fitur AI memakai API key Gemini-mu, dengan kuota gratis dari Google yang bisa berubah. Cek batas terbaru di Google AI Studio.*
2. **Seberapa akurat hitungan dari foto?** — *Itu estimasi. Porsi, minyak, dan bumbu sulit terlihat dari foto, jadi setiap hasil bisa kamu koreksi sebelum disimpan. Untuk hasil paling presisi, timbang makananmu dan pakai input manual.*
3. **Aman memasukkan API key?** — *Key dienkripsi di server dan tidak pernah dikirim balik ke browser. Kamu bisa menghapusnya kapan saja di Pengaturan.*
4. **Bagaimana target kalori dihitung?** — *Kami memakai rumus Mifflin-St Jeor untuk kalori istirahat, dikali tingkat aktivitas, lalu ditambah/dikurangi sesuai target berat dan waktumu. Ini perkiraan umum, bukan nasihat medis.*
5. **Bisa dipasang di HP?** — *Bisa, lewat "Tambahkan ke Layar Utama". Di iPhone, notifikasi pengingat baru berfungsi setelah aplikasi dipasang.*
6. **Data apa yang disimpan?** — ⚠️ **VERIFIKASI perilaku backend** (apakah foto disimpan atau langsung dibuang setelah dianalisis; retensi; penghapusan akun) lalu tulis apa adanya. Jangan menjanjikan fitur yang belum ada.

**H. CTA penutup** — *Siap catat makan siangmu hari ini?* + tombol **Mulai dengan Google**.

**I. Footer** — logomark, © tahun, tautan: *Kebijakan Privasi* (`/privacy`), *Syarat Penggunaan* (`/terms`), *Masuk*. Teks: *NutriSnap bukan alat medis. Untuk kondisi kesehatan tertentu, konsultasikan ke dokter atau ahli gizi.* Hapus tautan GitHub pribadi dan "Dashboard"/"Masuk Sesi". Buat halaman `/privacy` dan `/terms` sederhana (isi disusun dari perilaku backend nyata; tandai `TODO legal` jika belum ditinjau).

**Selesai bila:** tidak ada klaim di §1.1-S5; tidak ada istilah teknis di luar `<details>`; semua data contoh berlabel; Lighthouse a11y ≥ 95; tampilan baik di 375 / 768 / 1280 px, terang & gelap.

---

### Fase 4 — Login & Onboarding

**Login (`login/page.tsx`)**
- Badge → hapus. Judul: **Masuk ke NutriSnap**. Sub: *Catat kalori dan protein dari foto makananmu.*
- Tombol Google gaya standar: latar putih/`card`, border `input`, logo "G" **multiwarna resmi** (SVG), teks **Lanjut dengan Google**. (Bukan tombol hijau.)
- Hapus tombol demo (0.1). Ganti blok keamanan dengan 2 baris jujur: *Kami hanya memakai akun Google untuk masuk.* · *API key Gemini-mu disimpan terenkripsi.*
- `min-h-dvh`; tampilkan `?error=`; sesi aktif → kartu "Lanjut sebagai {nama}".

**Onboarding (`onboarding/page.tsx`)**
- Semua field kosong + `placeholder` (D3). Nama dari akun Google (boleh diedit).
- **Mode edit:** jika `GET /profile` ada, prefill semua field dan ubah judul menjadi "Ubah target" (B7). Tidak ada penimpaan nilai bawaan.
- Validasi memakai skema Zod dari `@nutrisnap/shared`; pesan galat per field via `Field`. Hapus `||` fallback (B17). Tombol Lanjut nonaktif sampai valid. Rentang: usia 13–100, tinggi 100–250, berat 25–300.
- Aturan keselamatan: usia < 18 → mode cutting tidak ditawarkan dan tampil catatan *"Target kalori umum tidak cocok untuk usia di bawah 18 tahun. Konsultasikan dengan dokter atau ahli gizi."* (selaras PRD v1.1).
- Aktivitas: 5 opsi (termasuk `very_active`) sebagai radio-kartu dengan contoh (*"Kerja kantoran, jarang olahraga"*, *"Olahraga 1–2×/minggu"*, dst).
- Langkah 2: satuan Bulan/Tahun tidak mereset nilai; tampilkan `selisih berat` dan `perubahan per minggu`.
- Langkah 3 (**Rencana harian**): tampilkan BMI (+ kategori Indonesia + catatan "bukan diagnosis"), kalori maintenance, target kalori + delta/hari, target protein, **dan** karbo/lemak. **Guardrail (B19):** bila delta di luar ±1000 kcal atau di bawah batas minimum, tampilkan banner dengan dua tombol: **"Sesuaikan ke rentang aman"** (terapkan −500 untuk cutting / +300…+500 untuk lean bulk → hitung ulang durasi) dan **"Ubah target"**.
- Langkah 4 (API key): tombol **"Lewati dulu"** yang eksplisit + penjelasan *"Tanpa key, scan foto dan Coach AI belum bisa dipakai. Input manual tetap jalan."*
- Mobile: tombol aksi di bar bawah menempel (`sticky bottom-0` + safe-area). Progress pakai `role="progressbar"`.
- Teks tombol: *Lanjut* · *Lihat rencana harian* · *Simpan & lanjut* · *Ke Beranda*.

**Selesai bila:** akun baru melihat form kosong; edit profil dari Settings menampilkan data lama; input tidak valid tidak menghasilkan pratinjau; guardrail bisa diterapkan dengan satu ketukan.

---

### Fase 5 — Beranda (`dashboard/page.tsx`) & `CalorieRing`

Susunan (mobile → desktop bento 12 kolom):

1. **Header:** *"Halo, {namaDepan}"* (H1) · tanggal panjang (`formatDateLong`) · `GoalChip`. Navigator tanggal: tombol ‹ › berukuran 44 px dengan `aria-label` ("Hari sebelumnya/berikutnya"), tombol "Hari ini", input tanggal (tidak boleh masa depan). Gunakan `shiftISO`.
2. **Kartu hero** (satu kartu, tanpa panel abu-abu di dalamnya):
   - Kiri: `CalorieRing` (angka besar = **sisa kcal**, kecil = "dari {target} kcal").
   - Kanan: `StatusPill` dengan ikon + kalimat dari `summary.status.label` (mis. *"Masih 620 kcal menuju target surplus"*) — ini elemen paling menonjol setelah ring. Di bawahnya 3 `MacroBar`: **Protein** (utama, lebih tebal), Karbohidrat, Lemak.
   - Baris kecil: *Kalori maintenance 2.415 kcal* (dengan penjelasan "kebutuhan untuk mempertahankan berat badan"). Hapus panel 3-statistik "TDEE / Target / Selisih".
3. **Waktu makan:** satu kartu berisi 4 baris (Sarapan, Makan Siang, Makan Malam, Camilan). Tiap baris: nama · `kcal • g protein` · tombol `+` (44 px). Baris terisi bisa dibuka untuk melihat item. Baris kosong cukup *"Belum dicatat"* satu baris — **bukan** kotak putus-putus per bagian. Sorot waktu makan yang sedang berlangsung berdasarkan jam lokal.
4. **Kosong total:** bila belum ada log hari ini → `EmptyState`: *"Belum ada makanan tercatat hari ini."* + dua tombol **Foto makanan** dan **Ketik manual**.
5. **Hapus:** `ConfirmDialog`/sheet + toast **Urungkan** 8 detik (tunda panggilan DELETE sampai toast habis). Tambah aksi **Edit** (sesuai PRD US-06) — ⚠️ lihat V4.
6. **Saran kontekstual** (ganti kartu "Bingung memilih menu…"): chip yang dihitung dari sisa target, mis. *"Sisa 45 g protein — tanya Coach"* → `/chat?prompt=<teks>`. Sembunyikan bila target tercapai.
7. **Loading/Error:** skeleton berbentuk ring + 3 bar + 4 baris; error → kartu dengan "Coba lagi".

**`CalorieRing`:** warna `stroke-primary`; track `stroke-muted`; penanda garis tipis posisi TDEE; jika `consumed > target` pada cutting → `stroke-status-over` + ikon `AlertTriangle` di pill; `role="img"` + `aria-label="{consumed} dari {target} kilokalori"`; animasi hormati reduced-motion; ukuran responsif (`size` prop, default 176, 208 di ≥768 px). Hapus `toUpperCase()` English; teks pill dari `StatusPill`.

**Selesai bila:** tidak ada angka bawaan; status surplus/defisit terbaca < 1,5 detik dengan ikon + teks; semua sentuhan ≥ 44 px; navigasi tanggal benar di zona WIB.

---

### Fase 6 — Catat (`log/page.tsx`)

- Judul: **Catat makanan**. Sub: *Foto piringmu atau ketik manual.* Hapus "(Gemini Multimodal)".
- **Pilih waktu makan:** default otomatis dari jam lokal (05–10 sarapan, 10–15 siang, 15–21 malam, lainnya camilan) kecuali `?mealType=`. Terima juga `?date=YYYY-MM-DD` agar mencatat ke tanggal yang sedang dilihat di Beranda. Simpan ke `loggedDate` yang benar (bukan "hari ini" UTC).
- **Tab segmented:** *Scan foto* | *Ketik manual* (label pendek agar tidak membungkus di 375 px).
- **Banner API key (B11):** bila `GET /apikey/status.hasKey=false` pada tab Scan → banner `warning` *"Scan foto butuh API key Gemini. Ketik manual tetap bisa dipakai."* + tombol **Atur API key** ke `/settings#api-key`. Tombol Scan dinonaktifkan dengan alasan jelas.
- **Scan — state sesuai DESIGN §3.2:** (1) Idle: dua tombol besar **Ambil foto** (`capture`) dan **Pilih dari galeri** (tanpa `capture`) + catatan opsional (*"mis. dada ayam tanpa kulit"*). (2) Memproses: thumbnail dengan overlay garis pindai + teks bertahap *"Mengecilkan foto…" → "Menghitung kalori & protein…"*. Tombol **Batal**. (3) Hasil: lihat di bawah.
- **Hasil scan (B8, B9):** label tegas *"Estimasi AI — periksa sebelum menyimpan"*. Tiap baris: nama (bisa diedit), berat (g), kalori (bisa diedit), P/K/L ringkas, hapus. Simpan **nilai per gram** (`base`) dari respons awal; hitung `kcal = base × gram` agar tidak ada galat berantai. Tombol **+ Tambah item**. Ringkasan total (kcal, P, K, L) di atas tombol **Simpan ke catatan**. Tombol bawah menempel di mobile.
- **Ketik manual (B8, D7):** state awal kosong. Chip makanan populer (tetap) + *"Terakhir dimakan"* (3–5 item dari riwayat bila ada). Simpan **per-100 g** dari estimasi, lalu **skalakan di klien** saat gram berubah (tanpa panggilan ulang); nilai kalori/protein tetap bisa dikoreksi manual. Tombol **Hitung otomatis** hanya dipanggil bila nama berubah. Sembunyikan karbo/lemak di bawah *"Detail makro"* yang bisa dibuka (default tertutup) agar form ringkas.
- Semua input memakai `Field` (label, `inputMode="decimal"`, satuan sebagai suffix). Validasi inline; tombol simpan nonaktif sampai valid.
- Setelah simpan: toast *"Tersimpan di {Sarapan}"* + navigasi ke Beranda tanggal terkait.
- Ganti `<img>` dengan `next/image` (`unoptimized` untuk data URL) atau beri `alt` dan ukuran eksplisit.

**Selesai bila:** form manual awalnya kosong; ubah gram menyesuaikan makro tanpa jaringan; scan bisa mengedit nama/kalori; Android bisa memilih dari galeri; banner key muncul bila belum ada.

---

### Fase 7 — Coach AI (`chat/page.tsx`)

- Judul: **Coach AI**. Sub: *Tanya menu, porsi, atau strategi bulking dan diet. Coach membaca sisa targetmu hari ini.*
- **Layout:** tinggi penuh viewport (`h-[calc(100dvh-<top>-<bottom nav>)]`), daftar pesan menggulir, **composer menempel di bawah** (di atas bottom nav + safe-area). Tanpa `Card` + `max-h-[360px]` bersarang.
- **Konteks (header ringkas, satu baris):** `GoalChip` + *"Sisa hari ini: 620 kcal · 45 g protein"*. Skeleton saat memuat; sembunyikan bila gagal (D6).
- **Quick prompt dinamis** dari sisa target (PRD US-07), contoh: *"Sisa {X} kcal dan {Y} g protein, sebaiknya makan apa malam ini?"*, *"Ide camilan tinggi kalori yang murah"*, *"Apakah progres hari ini sudah pas?"*, *"Pengganti dada ayam yang lebih murah"*. Tampil horizontal-scroll di atas composer saat percakapan kosong. Dukung `?prompt=` (dari Beranda): isi composer, jangan kirim otomatis.
- **Markdown (B13):** render balasan dengan `react-markdown` + `remark-gfm` (tabel, daftar, tebal), **tanpa HTML mentah**; gaya `prose` kecil dengan token tema; tabel dibungkus `overflow-x-auto`.
- **Kirim:** pesan pengguna muncul **optimistis**; gagal → tandai pesan dengan *"Gagal terkirim · Coba lagi"* (tidak hilang). `textarea` auto-grow, Enter kirim, Shift+Enter baris baru; `text-base` di mobile. Indikator mengetik ringan (tiga titik), bukan teks "Gemini Coach sedang menganalisis menu terbaik…".
- **Tanpa API key:** composer dinonaktifkan; kartu ajakan *"Coach AI butuh API key Gemini"* + tombol **Atur API key**. Hapus lencana kecil sebagai satu-satunya petunjuk.
- **Bersihkan percakapan:** `ConfirmDialog`. Ukuran teks bubble 14–15 px.
- Catatan kaki kecil: *Saran umum, bukan pengganti konsultasi dokter atau ahli gizi.*

**Selesai bila:** tabel/daftar dari AI tampil rapi; gagal kirim tidak menghilangkan pesan; di 375 px composer tidak tertutup keyboard/nav.

---

### Fase 8 — Progres (`analytics/page.tsx`)

- Judul: **Progres**. Hapus semua fallback palsu (D5). Tampilkan skeleton/empty state jujur: bila profil belum ada → CTA onboarding; bila belum ada timbangan → *"Catat berat pertamamu untuk mulai melihat grafik."*
- **Kartu ringkas (3):** *Berat sekarang → target* (dengan **bar perjalanan** % menuju target dari berat awal), *BMI* (kategori **Indonesia**: Kurus/Normal/Gemuk/Obesitas + catatan "bukan diagnosis"), *Target harian* (kcal + P). Pakai `formatKg`/`formatKcal`.
- **Grafik berat badan (baru, sesuai PRD):** garis berat dari `weightLogs` + garis putus target; sumbu tanggal pendek ("6 Nov"). Implementasi SVG ringan sendiri (`components/charts/weight-trend.tsx`) — tanpa library berat. Nilai terbaca lewat `title`/fokus untuk aksesibilitas.
- **Kepatuhan 7 hari:** **selalu 7 kolom** (hari tanpa catatan = 0, tampil abu), batang kalori dengan **garis target**, penanda protein. Ganti daftar `Progress` + tanggal ISO mentah. Ringkasan satu kalimat: *"Rata-rata 2.310 kcal · target tercapai 4 dari 7 hari."* (hitung nyata dari data).
- **Catat berat:** form kecil; input kosong dengan placeholder berat terakhir; simpan → toast; daftar riwayat 5 terakhir dengan tanggal terformat dan aksi hapus (konfirmasi) — ⚠️ lihat V4.

**Selesai bila:** grafik tren berat tampil dengan ≥2 titik data; 7 hari selalu lengkap; tidak ada tanggal ISO mentah di UI.

---

### Fase 9 — Pengaturan (`settings/page.tsx`) & PWA

- Judul: **Pengaturan**. Hapus lencana "Pusat Kendali Akun & Keamanan" dan "BYOK Vault".
- **Struktur:** bagian ber-anchor dengan navigasi lompat di atas (mobile: chip scroll; desktop: kolom kiri sticky): **Profil & target · API key Gemini (`#api-key`) · Pengingat makan · Tampilan · Akun**. Satu `ThemeToggle` di bagian **Tampilan**, dengan pilihan *Terang / Gelap / Ikuti sistem*.
- **Profil & target:** tampilkan nilai dengan `formatKg`/`formatKcal` ("kcal", bukan "kkal"); gunakan font sans (hapus `font-mono`); tombol **Ubah target** → `/onboarding` mode edit (B7). Program ditampilkan lewat `GoalChip`.
- **`ByokKeyCard`:** hapus "96-bit IV + 128-bit Auth Tag" dari deskripsi (pindah ke Detail teknis). Judul: **API key Gemini**. Deskripsi: *Dipakai untuk scan foto dan Coach AI. Disimpan terenkripsi dan tidak pernah ditampilkan lagi.* Tambah: tombol tampilkan/sembunyikan input, tombol **Tempel**, daftar 3 langkah mendapatkan key, alasan tombol nonaktif ("Key terlalu pendek"), label tombol **Simpan & uji key**, pesan kuota/gagal validasi yang jelas. Placeholder pendek (`AIza…`); status tersimpan tampil di lencana, bukan di placeholder.
- **Pengingat makan (B12, D8):** tambah **Switch** utama; **zona waktu** (default dari perangkat, bisa diubah); tiga jam. Alur *Aktifkan*: minta izin → jika `denied`/tidak didukung/subscribe gagal → tampilkan keadaan jelas (*"Izin notifikasi ditolak. Aktifkan di pengaturan browser."*) dan **jangan** mengirim langganan palsu ke backend. Hapus nilai `push.nutrisnap.local` dkk. Tombol **Uji notifikasi** hanya aktif bila langganan nyata ada dan memicu push dari server (bukan `new Notification` lokal). Catatan iOS: *"Di iPhone, pasang NutriSnap ke Layar Utama dulu."* Pindahkan pendaftaran SW ke `PwaManager` (Fase 2.6). Label lencana: **Terpasang / Belum terpasang**, bukan "PWA Ready / Web Mode".
- **Akun:** tombol **Keluar**. ⚠️ **Opsional/Backlog:** *Ekspor data* dan *Hapus akun* (jika backend mendukung; kalau belum, buat tiket — jangan tampilkan tombol palsu).

**Selesai bila:** Switch pengingat berfungsi dan tersimpan; tidak ada langganan palsu yang terkirim; kunci tidak tampil di placeholder; `#api-key` dari banner Log/Chat mendarat tepat di kartunya.

---

### Fase 10 — QA akhir & sinkronisasi dokumen

1. **Perintah:** `pnpm typecheck && pnpm build && pnpm test && pnpm check:contrast`. Ganti skrip `lint` (sekarang hanya `tsc --noEmit`) dengan linter sungguhan (Biome atau ESLint) dan perbaiki impor/variabel tak terpakai (D11).
2. **Pengujian manual** — matriks: viewport **375 / 768 / 1280** × tema **terang / gelap** × status **baru daftar / terisi / API gagal / tanpa API key**. Tidak boleh ada: scroll horizontal, teks terpotong, kontras buruk, angka bawaan, teks Inggris tersisa selain kata serapan di glosarium.
3. **Aksesibilitas:** navigasi keyboard di semua form, fokus terlihat, label terhubung, `aria-live="polite"` untuk toast/status, Lighthouse a11y ≥ 95, zoom 200% tetap utuh.
4. **Pencarian sisa dummy:** `grep -rniE "raka|pratama|google-.*-user|2415|2800|680|19\.77|push\.nutrisnap\.local" apps/frontend/src` → harus kosong (kecuali label contoh di landing).
5. **Dokumen:** perbarui `docs/PROGRESS_TRACKER.md` (Sprint 6 → DONE + changelog), `docs/API_CONTRACT.md` bila ada perubahan endpoint, `docs/BUGS.md` (catat B1–B20 yang diperbaiki dan keputusan B20).

---

## 4. Daftar Verifikasi Backend (⚠️ tidak sempat diaudit)

| # | Periksa | Tindakan bila ternyata benar |
|---|---------|------------------------------|
| V1 | `POST /auth/google/token` menerima `googleId/email/name` dari klien | Nonaktifkan di produksi / lindungi secret; tulis di `BUGS.md` |
| V2 | `GET /auth/me` mengembalikan `onboardingCompleted` (untuk `AuthGate`) | Tambahkan ke respons + `API_CONTRACT.md` |
| V3 | `/meals/daily` memakai `loggedDate` (string tanggal), bukan timestamp UTC | Sesuaikan agar konsisten dengan zona waktu profil |
| V4 | Tersedia endpoint ubah item (`PATCH /meals/:id`) dan hapus timbangan | Tambahkan bila belum ada (Fase 5 Edit, Fase 8 hapus) |
| V5 | Kategori BMI dan `evaluateDailySurplusDeficitStatus.label` di `packages/shared` berbahasa Inggris/Indonesia? | Pastikan label berbahasa Indonesia dan sesuai glosarium; tambah test |
| V6 | Perilaku penyimpanan foto & retensi data | Dasar penulisan FAQ #6 dan halaman `/privacy` |
| V7 | Cookie sesi lintas-subdomain (B20) | Pertimbangkan `Domain=.<domain>; SameSite=Lax; HttpOnly; Secure` dan hentikan token di `localStorage`/URL |

---

## 5. Di Luar Cakupan (jangan dikerjakan di Sprint 6)

- Perubahan rumus bisnis di `packages/shared` (kecuali label bahasa V5).
- Streaming respons chat, pencarian makanan *as-you-type* dari katalog (boleh jadi Sprint 7).
- Ambang BMI Asia-Pasifik/Kemenkes (keputusan produk; saat ini WHO sesuai PRD).
- Multi-bahasa (i18n); UI saat ini Indonesia saja.
