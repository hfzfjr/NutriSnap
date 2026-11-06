# Agile Progress Tracker (PROGRESS_TRACKER.md) — NutriSnap

> **Current Active Sprint:** Sprint 6 — UI/UX & Data Integrity Refactor (`TODO`, lihat `docs/REFACTOR.md`). Sprint 0 – Sprint 5 Completed.  
> **Overall Project Completion:** `98 / 98 Story Points (100.0%)`  
> **Last Updated:** 2026-11-06

---

## 1. Sprint Velocity & Summary Dashboard

| Sprint | Nama Sprint | Story Points (Done / Total) | Progress | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Sprint 0** | Foundation, Agile Docs, Monorepo & Database | `16 / 16 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 1** | Auth, Personalization Onboarding & BYOK Vault | `21 / 21 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 2** | Dual Nutrition Logging (AI Vision + Manual Gram) | `24 / 24 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 3** | Interactive Dashboard, Responsive Nav & Analytics | `18 / 18 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 4** | AI Bulking & Diet Assistant Chatbot | `13 / 13 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 5** | PWA, Scheduled Meal Push Notifications & Coolify | `16 / 16 SP` | `100.0%` | 🟢 `DONE` |
| **TOTAL** | **Seluruh Proyek NutriSnap** | **`98 / 98 SP`** | **`100.0%`** | 🟢 **`COMPLETED`** |

---

## 2. Detailed Agile Task Board

### Sprint 0: Foundation, Agile Documentation & Monorepo Core
- [x] **`NS-001`** (3 SP) — Penyusunan `AGENTS.md` (root) serta `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `SPRINT.md`, dan `PROGRESS_TRACKER.md` di `/docs` — **DONE**
- [x] **`NS-002`** (2 SP) — Inisialisasi Monorepo (`pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, `.env.example`, `docker-compose.coolify.yml`) — **DONE**
- [x] **`NS-003`** (5 SP) — Pembuatan `packages/shared`: Rumus BMI, BMR (Mifflin-St Jeor), TDEE, Surplus/Deficit Calculator, & Zod Schemas + Unit Tests — **DONE**
- [x] **`NS-004`** (3 SP) — Setup `apps/backend` (Fastify TypeScript server, CORS, Env Validator, Drizzle ORM + Skema PostgreSQL Lengkap + Seed Makanan Lokal) — **DONE**
- [x] **`NS-005`** (3 SP) — Setup `apps/frontend` (Next.js App Router, Tailwind CSS, Shadcn UI, Design System Tokens Light/Dark, Responsive Bottom Nav `<768px` & Sidebar `>=768px`) — **DONE**

### Sprint 1: Authentication, Onboarding Engine & BYOK Security Vault
- [x] **`NS-101`** (5 SP) — Implementasi Modul Enkripsi `AES-256-GCM` (`encryptApiKey`, `decryptApiKey`) beserta Unit Test keamanan — **DONE**
- [x] **`NS-102`** (5 SP) — Implementasi Google OAuth 2.0 Authentication & Session Management (`auth` module + middleware) — **DONE**
- [x] **`NS-103`** (5 SP) — Endpoint & UI manajemen BYOK Gemini API Key (`/api/v1/apikey` + live validation ke Google Gemini API) — **DONE**
- [x] **`NS-104`** (6 SP) — Endpoint & Multi-step UI Wizard `/onboarding` (Input Nama, Usia, Tinggi, Berat, Gender, Target Berat, Target Bulan/Tahun -> Kalkulasi BMI, TDEE, Kalori & Protein) — **DONE**

### Sprint 2: Dual Nutrition Logging (AI Food Photo Scanner & Manual Input)
- [x] **`NS-201`** (3 SP) — Utilitas kompresi gambar di browser (`<= 1280px`, WebP/JPEG) untuk mempercepat upload dari kamera HP — **DONE**
- [x] **`NS-202`** (8 SP) — Service Gemini Multimodal Food Vision (`POST /api/v1/meals/scan-photo`) dengan `responseSchema` JSON terstruktur — **DONE**
- [x] **`NS-203`** (5 SP) — Service Kalkulator Makro Manual (`POST /api/v1/meals/estimate-manual`) menggunakan DB makanan lokal + fallback Gemini — **DONE**
- [x] **`NS-204`** (3 SP) — Endpoint CRUD Meal Logs (`POST /api/v1/meals`, `GET /api/v1/meals/daily`, `DELETE /api/v1/meals/:id`) — **DONE**
- [x] **`NS-205`** (5 SP) — Halaman `/log` Dual Logger UI: Tab 1 (AI Camera Scanner + Editable Confirmation Card) & Tab 2 (Manual Input + Berat Gram) — **DONE**

### Sprint 3: Interactive Dashboard, Responsive Navigation (`<768px`) & Analytics
- [x] **`NS-301`** (5 SP) — Responsive App Shell: Fixed Bottom Navbar pada `< 768px` (dengan tombol tengah Scan/Log) & Sidebar pada `>= 768px` — **DONE**
- [x] **`NS-302`** (8 SP) — Halaman `/dashboard`: Calorie Ring, Surplus/Deficit Status Tracker, Macro Progress Bars (Protein/Carbs/Fat), & Daily Meal Timeline — **DONE**
- [x] **`NS-303`** (5 SP) — Halaman `/analytics`: Pencatatan berat badan berkala (`weight_logs`), BMI Tracker, & grafik kepatuhan kalori mingguan — **DONE**

### Sprint 4: Contextual AI Bulking & Diet Assistant Chatbot
- [x] **`NS-401`** (5 SP) — Backend AI Diet Coach (`POST /api/v1/chat/message` & `GET /api/v1/chat/history`) dengan injeksi dinamis profil BMR/TDEE & sisa kalori/protein hari ini — **DONE**
- [x] **`NS-402`** (5 SP) — Halaman `/chat`: Antarmuka Chatbot modern dengan *Quick Prompt Chips*, dukungan Markdown, dan indikator *status konteks nutrisi* — **DONE**
- [x] **`NS-403`** (3 SP) — Penanganan *graceful fallback* & pesan panduan ramah jika BYOK API Key pengguna belum diatur atau mencapai kuota limit — **DONE**

### Sprint 5: PWA, Scheduled Push Notifications & Coolify Production Readiness
- [x] **`NS-501`** (5 SP) — Konfigurasi PWA (`manifest.ts`, ikon multi-ukuran, Apple PWA meta tags, Service Worker `public/sw.js`, & Install Banner) — **DONE**
- [x] **`NS-502`** (5 SP) — Modul Web Push VAPID (`/api/v1/notifications/*`) & Cron Scheduler (`meal-reminder.job.ts`) untuk mengecek makan harian yang belum di-log — **DONE**
- [x] **`NS-503`** (3 SP) — Halaman `/settings` lengkap: Manajemen BYOK API Key, Edit Target Berat/Kalori, Pengaturan Jam Push Notification, & Toggle Light/Dark Mode — **DONE**
- [x] **`NS-504`** (3 SP) — Pembuatan `Dockerfile` (`apps/frontend` & `apps/backend`), `docker-compose.coolify.yml`, `.env.example`, dan pengujian build End-to-End — **DONE**

---

### Sprint 6: UI/UX, Konten & Data Integrity Refactor (rujukan: `docs/REFACTOR.md`)
> Catatan: Sprint 6 adalah perbaikan atas Sprint 0–5, bukan fitur baru; tabel velocity di atas belum memasukkannya.
- [x] **`NS-601`** — Fase 0: Hapus auto-login/akun demo, `AuthGate`, `apiFetch` jujur, hapus semua nilai fallback palsu, perbaikan tanggal/zona waktu, viewport zoom, ikon PNG + manifest — **DONE**
- [x] **`NS-602`** — Fase 1: Token warna "Dapur Segar", tipografi (2 font), primitif UI baru, sapu bersih warna hardcoded, skrip `check:contrast` — **DONE**
- [x] **`NS-603`** — Fase 2: App shell, navigasi berbahasa Indonesia, safe-area, status API key nyata, `loading/error/not-found`, `PwaManager` global + Install Banner — **DONE**
- [x] **`NS-604`** — Fase 3: Landing page ditulis ulang (copy final, mockup nyata, kalkulator tervalidasi, `/privacy`, `/terms`) — **DONE**
- [x] **`NS-605`** — Fase 4: Login & Onboarding (form kosong, mode edit, validasi, guardrail bisa ditindaklanjuti, 5 tingkat aktivitas) — **DONE**
- [x] **`NS-606`** — Fase 5: Beranda & `CalorieRing` (status berikon, timeline waktu makan, empty/loading/error state, hapus + urungkan) — **DONE**
- [x] **`NS-607`** — Fase 6: Halaman Catat (galeri + kamera, edit hasil scan, skala per-gram, banner API key, form kosong) — **DONE**
- [x] **`NS-608`** — Fase 7: Coach AI (Markdown, pesan optimistis, quick prompt dinamis, layout penuh layar) — **DONE**
- [x] **`NS-609`** — Fase 8: Progres (grafik berat, 7 hari lengkap, tanpa fallback palsu) — **DONE**
- [x] **`NS-610`** — Fase 9: Pengaturan & PWA (Switch pengingat, zona waktu, tanpa langganan palsu, kartu API key baru) — **DONE**
- [x] **`NS-611`** — Fase 10: QA, linter sungguhan, sinkronisasi dokumen, verifikasi backend V1–V7 — **DONE**

---

## 3. Changelog & Activity Log

| Tanggal | Task ID | Ringkasan Aktivitas | Oleh |
| :--- | :--- | :--- | :--- |
| `2026-11-06` | `NS-001` | Merampungkan review arsitektur Monorepo Full Coolify serta membuat `AGENTS.md` (di root) dan suite dokumentasi Agile (`PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `SPRINT.md`, `PROGRESS_TRACKER.md`) di dalam `/docs`. | Principal Architect Agent |
| `2026-11-06` | `NS-002`, `NS-003`, `NS-004`, `NS-005` | Menyelesaikan seluruh **Sprint 0**: Inisialisasi `pnpm` workspace monorepo, implementasi `@nutrisnap/shared` (BMI, BMR Mifflin-St Jeor, TDEE, Surplus/Deficit Engine, Zod Schemas + 6 Unit Tests), setup `@nutrisnap/backend` (Fastify + Drizzle PostgreSQL Schema 9 tabel + Katalog 25 Makanan Lokal Indonesia + 2 Integration Tests), serta setup `@nutrisnap/frontend` (Next.js 15 App Router, Shadcn Design System Light/Dark, Responsive Bottom Nav `<768px` & Desktop Sidebar `>=768px`, PWA Manifest). Seluruh `pnpm test`, `pnpm typecheck`, dan `pnpm build` lulus 100%. | Principal Architect Agent |
| `2026-11-06` | `NS-101`, `NS-102`, `NS-103`, `NS-104` | Menyelesaikan seluruh **Sprint 1** pada branch `feat/sprint-1` dan merge ke `main`: Implementasi BYOK Vault `AES-256-GCM` (`vault.ts`), Google OAuth 2.0 + HMAC Session/Bearer Auth (`auth.routes.ts`), manajemen BYOK Gemini API Key (`/api/v1/apikey`), serta 4-step Onboarding Wizard (`/onboarding`) dengan perhitungan otomatis BMI, BMR, TDEE, Surplus/Deficit, dan Macro Split. | Principal Architect Agent |
| `2026-11-06` | `NS-201` – `NS-205` | Menyelesaikan seluruh **Sprint 2** pada branch `feat/sprint-2` dan merge ke `main`: Utilitas kompresi gambar client-side (`<= 1280px`), Gemini Multimodal Food Vision (`food-vision.service.ts`) dengan `responseSchema` JSON terstruktur, Hybrid Manual Macro Estimator (`manual-estimator.service.ts`), endpoint CRUD Meal Logs (`meals.routes.ts`), dan halaman Dual Logger `/log` (Tab Kamera AI + Tab Input Manual Gram). | Principal Architect Agent |
| `2026-11-06` | `NS-301`, `NS-302`, `NS-303` | Menyelesaikan seluruh **Sprint 3** pada branch `feat/sprint-3` dan merge ke `main`: Komponen SVG `CalorieRing`, halaman `/dashboard` interaktif (Date Navigator, Calorie Ring, Macro Progress Bars, Meal Timeline), serta halaman `/analytics` (7-day Calorie Adherence Chart, Weight Log History, dan BMI Category Tracker). | Principal Architect Agent |
| `2026-11-06` | `NS-401`, `NS-402`, `NS-403` | Menyelesaikan seluruh **Sprint 4** pada branch `feat/sprint-4` dan merge ke `main`: Backend Contextual AI Bulking & Diet Coach (`chat.routes.ts`) dengan injeksi real-time profil BMR/TDEE dan sisa kalori/protein harian ke `systemInstruction`, halaman `/chat` dengan Quick Prompt Chips, serta graceful fallback saat BYOK API Key belum diatur. | Principal Architect Agent |
| `2026-11-06` | `NS-501` – `NS-504` | Menyelesaikan seluruh **Sprint 5** pada branch `feat/sprint-5` dan merge ke `main`: Service Worker PWA (`public/sw.js`) & ikon (`public/icons/icon.svg`), Web Push VAPID (`/api/v1/notifications/*`) + Cron Scheduler pengingat makan harian (`meal-reminder.job.ts`), halaman `/settings` lengkap, serta verifikasi akhir End-to-End (`pnpm test`, `pnpm typecheck`, `pnpm build` 100% sukses). | Principal Architect Agent |
| `2026-11-06` | `NS-601` | Merampungkan **Fase 0 (Data Integrity & Auth Architecture)** pada branch `feat/sprint-6`: Penghapusan seluruh auto-login demo dan data fallback fiktif (`2415/2800 kcal`, `raka@nutrisnap.app`), pembuatan `AuthGate` dan `AppShell` protektif, perbaikan penanggalan berbasis zona waktu (`lib/date.ts`, `lib/format.ts`), utilitas `apiFetch` jujur, pembuatan logomark plate + focus brackets, generasi ikon PWA PNG (192, 512, maskable 512, apple-touch), update `manifest.ts`, serta pembuatan error boundaries (`not-found.tsx`, `error.tsx`, `loading.tsx`). | Principal Architect Agent |
| `2026-11-06` | `NS-602` | Menyelesaikan **Fase 1 (Design Tokens & UI Primitives)** pada branch `feat/sprint-6`: Penggantian seluruh palet ke "Dapur Segar" (Warm Kitchen), konfigurasi tipografi Plus Jakarta Sans & Fraunces, pembersihan warna hardcoded, instalasi `@radix-ui/react-dialog`, `@radix-ui/react-switch`, `sonner`, pembuatan primitif `MacroBar`, `StatusPill`, `GoalChip`, `Switch`, `Field`, `EmptyState`, dan `CalorieRing` dengan penanda TDEE, serta skrip `check:contrast` (20/20 lulus WCAG AA). | Principal Architect Agent |
| `2026-11-06` | `NS-603` | Merampungkan **Fase 2 (App Shell & Navigation)** pada branch `feat/sprint-6`: Navigasi bawah berbahasa Indonesia (`Beranda`, `Progres`, `Catat`, `Coach`, `Pengaturan`) dengan safe area dan touch targets $\ge 44 \times 44\text{ px}$, Desktop Sidebar dengan Logomark resmi + live Gemini BYOK status + user profile logout, error boundaries (`not-found.tsx`, `error.tsx`, `loading.tsx`), serta `InstallBanner` PWA non-intrusif. | Principal Architect Agent |
| `2026-11-06` | `NS-604` | Menyelesaikan **Fase 3 (Landing Page & Legal Pages)** pada branch `feat/sprint-6`: Penulisan ulang landing page modular (`navbar`, `hero`, `interactive-demo`, `quick-calculator`, `features-grid`, `faq`, `footer`), penyediaan halaman legal `/privacy` dan `/terms` dengan penafian medis resmi, serta pembersihan total seluruh warna hardcoded dari halaman depan. | Principal Architect Agent |
| `2026-11-06` | `NS-605` | Merampungkan **Fase 4 (Login & Onboarding Refactor)** pada branch `feat/sprint-6`: Pembaruan halaman Onboarding 4 langkah dengan deteksi mode edit dari profil aktif, 5 tingkat aktivitas harian lengkap (BMR x 1.2 hingga 1.9), validasi rentang fisik, tombol aksi penyesuaian durasi otomatis pada guardrail kalori, serta alur pendaftaran mulus tanpa akun palsu. | Principal Architect Agent |
| `2026-11-06` | `NS-606` | Menyelesaikan **Fase 5 (Beranda & CalorieRing Refactor)** pada branch `feat/sprint-6`: Sapaan berbasis jam lokal ("Selamat Pagi/Siang/Sore/Malam, [Nama]"), integrasi `StatusPill` dan `MacroBar`, 4 kartu sesi makan dengan tombol aksi cepat, toast penghapusan informatif via Sonner, serta EmptyState & Error Retry State tanpa nilai dummy. | Principal Architect Agent |
| `2026-11-06` | `NS-607` | Merampungkan **Fase 6 (Halaman Catat Makanan / Log Refactor)** pada branch `feat/sprint-6`: Penyediaan dwi-aksi terpisah Kamera Ponsel vs Galeri Foto, banner pengingat Kunci Gemini BYOK yang ramah, inline editing judul & nama komponen hasil scan, tombol skala gramasi cepat (100g, 150g, 200g), penambahan komponen manual, input manual tanpa angka dummy, dan toast Sonner. | Principal Architect Agent |
| `2026-11-06` | `NS-608` | Menyelesaikan **Fase 7 (Coach AI Refactor)** pada branch `feat/sprint-6`: Integrasi `react-markdown` untuk rendering jawaban terformat (bold, list, code), pesan optimistis instan saat pengguna mengirim chat, thinking bubble indicator saat menunggu respon AI, chip saran pertanyaan dinamis berbasis sisa kalori & protein hari ini, tombol konfirmasi bersihkan riwayat chat dengan toast Sonner, serta layout responsif bebas scroll ganda. | Principal Architect Agent |
| `2026-11-06` | `NS-609` | Menyelesaikan **Fase 8 (Progres / Analytics Refactor)** pada branch `feat/sprint-6`: Pembuatan grafik SVG ringan `WeightTrendChart` dengan garis tren berat + garis putus target + tooltip aksesibel, visualisasi kepatuhan kalori 7 hari lengkap dengan penanda target harian & protein, 3 kartu statistik ringkas berstandar WHO & rumus riil tanpa angka palsu, form catat timbangan dengan toast Sonner, serta aksi hapus timbangan via `DELETE /api/v1/profile/weight/:id` (memenuhi Backend Verification V4). | Principal Architect Agent |
| `2026-11-06` | `NS-610` | Menyelesaikan **Fase 9 (Pengaturan & PWA Refactor)** pada branch `feat/sprint-6`: Pembaruan halaman Pengaturan dengan navigasi chip lompat ber-anchor (`#profil`, `#api-key`, `#pengingat`, `#tampilan`, `#akun`), perombakan `ByokKeyCard` (tombol intip/sembunyi, tombol tempel klip, panduan 3 langkah, detail teknis enkripsi AES-256-GCM), pembaruan `PwaPushReminderCard` (Switch Radix, deteksi zona waktu perangkat, alur izin notifikasi nyata tanpa data palsu, tombol uji notifikasi aman, catatan iOS PWA), dan integrasi `ThemeToggle` ramah kontras. | Principal Architect Agent |
| `2026-11-06` | `NS-611` | Menyelesaikan **Fase 10 (QA Akhir, Verifikasi Backend V1–V7 & Sprint 6 Merge)**: Pengujian end-to-end tanpa error (`pnpm typecheck`, `pnpm test` di shared & backend, `pnpm check:contrast` 20/20 lulus WCAG AA, `pnpm build` Next.js 15), verifikasi backend V1-V7 (proteksi demo route di produksi, `onboardingCompleted` di auth response, penanggalan zona waktu riil, endpoint `DELETE /api/v1/profile/weight/:id` & `PATCH /api/v1/meals/:id`, label Indonesia di shared calculator, perilaku penyimpanan foto di memori, dan konfigurasi `COOKIE_DOMAIN`), sinkronisasi `docs/API_CONTRACT.md`, `docs/BUGS.md`, serta eliminasi total data fiktif dummy. | Principal Architect Agent |
| `2026-11-06` | `HOTFIX-AI` | **Pembaruan Model Gemini AI ke `gemini-3.8-flash`**: Migrasi menyeluruh dari `gemini-2.5-flash` yang telah dibatasi oleh Google untuk akun/kunci API baru. Menambahkan auto-migration kunci tersimpan lama di backend & DB PostgreSQL, fallback otomatis ke `gemini-3.8-flash`, sanitasi pesan error Google JSON agar tidak bocor mentah ke toast frontend, serta pembaruan opsi model di Pengaturan UI (`gemini-3.8-flash` & `gemini-3.8-pro`). | Principal Architect Agent |
| `2026-11-06` | `HOTFIX-UI-CHAT-PUSH` | **Perbaikan Komprehensif UI Pengaturan, Coach AI Multi-Turn, Input Zoom & Web Push**: (1) Memunculkan angka target protein & karbo/lemak serta mengganti panah teks ke Lucide `ArrowRight` di Pengaturan Profil, (2) Memperpendek label tombol model Gemini ke nama model murni (`gemini-3.8-flash` & `gemini-3.8-pro`), (3) Mendesain ulang baris pengingat jam makan menjadi kartu vertikal yang pas di layar mobile (`w-28 h-9 text-center`), (4) Menghubungkan respon Coach AI ke Gemini AI asli dengan riwayat multi-turn + pesan ramah jika kunci belum diatur, (5) Mencegah mobile input auto-zoom di iOS dengan font 16px universal & `maximumScale: 1`, (6) Menambahkan keypair VAPID default dan tes pengiriman push langsung tanpa butuh pihak ketiga. | Principal Architect Agent |
