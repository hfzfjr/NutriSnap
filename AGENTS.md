# AGENTS.md — NutriSnap Engineering & AI Agent Guidelines

> **Project:** NutriSnap (AI-Powered Nutrition, Bulking & Diet Tracker PWA)  
> **Architecture:** Full-Stack TypeScript Monorepo (`apps/frontend`, `apps/backend`, `packages/shared`)  
> **Deployment Target:** Self-Hosted Coolify (Single Docker Network for `< 1ms` Internal Latency)  
> **Methodology:** Agile Scrum / Iterative Sprint Delivery

Dokumen ini adalah sumber kebenaran utama (*Single Source of Truth*) bagi setiap AI Coding Agent maupun Software Engineer yang bekerja di repositori **NutriSnap**. Setiap perubahan kode, penambahan fitur, atau pembaruan arsitektur **wajib** mematuhi aturan di dalam dokumen ini.

---

## 1. Peta Dokumentasi Proyek (`/docs`)

Sebelum menulis atau memodifikasi kode, selalu rujuk dokumen yang relevan di folder [`/docs`](file:///d:/CODING/PROJECT/nutrisnap/docs):

| File Dokumen | Fungsi Utama | Kapan Harus Dibaca / Diperbarui |
| :--- | :--- | :--- |
| [`docs/PRD.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/PRD.md) | Product Requirements Document, User Stories, Acceptance Criteria, & Rumus Bisnis Nutrisi. | Sebelum mengimplementasikan fitur baru atau memvalidasi *edge case* produk. |
| [`docs/DESIGN.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/DESIGN.md) | Spesifikasi UI/UX, Design Tokens (Light/Dark), Responsive Layout (`<768px` Bottom Nav), & Komponen PWA. | Saat membangun halaman/komponen di `apps/frontend`. |
| [`docs/ARCHITECTURE.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/ARCHITECTURE.md) | Topologi Monorepo Coolify, Skema Database ERD, Enkripsi BYOK `AES-256-GCM`, & Pipeline Gemini AI. | Saat menyentuh `apps/backend`, database, enkripsi, atau konfigurasi Docker/Coolify. |
| [`docs/API_CONTRACT.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/API_CONTRACT.md) | Kontrak REST API antara `apps/frontend` dan `apps/backend`, termasuk JSON Schema Gemini. | Saat membuat/mengubah endpoint di backend atau data fetcher di frontend. |
| [`docs/SPRINT.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/SPRINT.md) | Rencana Sprint Agile (Sprint 0 – Sprint 5), Backlog, Story Points, & Definition of Done (DoD). | Saat memulai sesi pengerjaan sprint atau merencanakan iterasi berikutnya. |
| [`docs/REFACTOR.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/REFACTOR.md) | Rencana refactor UI/UX, konten, dan integritas data per fase (Sprint 6), lengkap dengan temuan audit & daftar verifikasi backend. | Saat mengerjakan Sprint 6 atau menyentuh tampilan/teks di `apps/frontend`. |
| [`docs/PROGRESS_TRACKER.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/PROGRESS_TRACKER.md) | Live Agile Board, Status Task (`TODO`, `IN_PROGRESS`, `DONE`), & Changelog. | **Wajib diperbarui** setiap kali memulai dan menyelesaikan suatu task. |

---

## 2. Struktur Monorepo & Batasan Tanggung Jawab (*Separation of Concerns*)

Proyek ini menggunakan **pnpm workspaces** dengan pemisahan ketat antara Frontend, Backend, dan Shared Package:

```text
nutrisnap/
├── AGENTS.md                  # Panduan AI Agent & Konvensi Engineering (File ini)
├── docs/                      # Dokumentasi Agile, PRD, Design, Architecture, API
├── apps/
│   ├── frontend/              # Next.js (App Router), Tailwind CSS, Shadcn UI, PWA
│   └── backend/               # Node.js TypeScript API Server, Drizzle ORM, Gemini SDK, Cron Push
├── packages/
│   └── shared/                # Shared Zod Schemas, DTO Types, & Rumus Kalkulasi Nutrisi
├── docker-compose.coolify.yml # Orkestrasi produksi untuk Coolify Home Server
└── pnpm-workspace.yaml
```

### Aturan Batas Modul (*Module Boundaries*):
1. **`apps/frontend` TIDAK BOLEH:**
   - Mengakses database PostgreSQL secara langsung.
   - Menyimpan, mendekripsi, atau memanggil Google Gemini API langsung dari browser menggunakan API key user.
   - Mengimpor file apa pun dari `apps/backend`.
2. **`apps/backend` BERTANGGUNG JAWAB ATAS:**
   - Seluruh koneksi ke PostgreSQL (via Drizzle ORM) dan Object Storage (MinIO/Local Volume di Coolify).
   - Enkripsi dan dekripsi BYOK Gemini API Key menggunakan `AES-256-GCM` di dalam memori server.
   - Pemanggilan `@google/genai` (baik untuk *Multimodal Food Photo Scanner* maupun *Streaming Bulking/Diet Chatbot*).
   - Penjadwalan (*Cron Job*) dan pengiriman Web Push Notifications (VAPID) untuk makan harian yang belum di-log.
3. **`packages/shared` ADALAH JEMBATAN KONTRAK:**
   - Semua skema validasi input/output (Zod), tipe DTO TypeScript, serta fungsi murni kalkulasi nutrisi (BMI, BMR Mifflin-St Jeor, TDEE, Surplus/Deficit, Macro Split) harus ditempatkan di `packages/shared` agar dapat digunakan bersama oleh `apps/frontend` dan `apps/backend` tanpa duplikasi logika.

---

## 3. Aturan Keamanan Mutlak (*Non-Negotiable Security Rules*)

### 3.1. Keamanan BYOK (Bring Your Own Gemini API Key)
- **Algoritma Wajib:** `AES-256-GCM` (`node:crypto`) dengan 12-byte (96-bit) random Initialization Vector (IV) unik per enkripsi dan 16-byte (128-bit) Authentication Tag.
- **Format Penyimpanan DB:** `iv_base64:authTag_base64:ciphertext_base64` pada kolom `encrypted_key` di tabel `user_api_keys`.
- **Master Key:** Hanya dibaca dari `process.env.ENCRYPTION_MASTER_KEY` (64 karakter hex / 32 byte) di `apps/backend`.
- **Zero Plaintext Exposure:**
  - API Key asli **dilarang keras** ditulis ke `console.log`, file log, error message, atau dikirim kembali melalui HTTP response ke `apps/frontend`.
  - Endpoint `GET /api/v1/apikey/status` hanya boleh mengembalikan `hasKey: boolean`, `isValid: boolean`, `keyHint: string` (mis. `"AIza...9xQp"`), dan `preferredModel: string`.

### 3.2. Autentikasi & Otorisasi
- Setiap endpoint di `apps/backend` (kecuali `/api/v1/auth/*` dan `/api/v1/health`) wajib memverifikasi sesi pengguna yang terautentikasi melalui Google OAuth.
- Setiap query database wajib menyertakan filter kepemilikan data (`WHERE user_id = currentUser.id`) untuk mencegah celah *Insecure Direct Object Reference (IDOR)*.

---

## 4. Standar Teknis & Kualitas Kode

### 4.1. TypeScript & Validasi
- Gunakan **TypeScript Strict Mode** (`"strict": true`, dilarang menggunakan `any` tanpa alasan eksplisit).
- Seluruh payload request API, query parameter, dan environment variable wajib divalidasi dengan **Zod**.

### 4.2. Integrasi Google Gemini AI (`@google/genai`)
- Gunakan SDK resmi terbaru `@google/genai` (bukan SDK lama `@google/generative-ai` yang sudah *deprecated*).
- Model default untuk kecepatan dan efisiensi multimodal: `gemini-2.5-flash`.
- Untuk **AI Food Photo Scanner**, wajib menggunakan **Structured Outputs** (`responseMimeType: "application/json"` dan `responseSchema`) agar output selalu berupa JSON terstruktur yang valid dan sesuai dengan kontrak di `packages/shared`.
- Untuk **AI Bulking/Diet Chatbot**, injeksikan ringkasan profil pengguna (target bulking/cutting, target kalori/protein harian, dan progres makan hari ini) ke dalam `systemInstruction` agar jawaban AI selalu kontekstual dan dipersonalisasi.

### 4.3. UX/UI, Mobile-First & PWA (`apps/frontend`)
- **Responsive Navigation:**
  - Pada layar `< 768px` (mobile/PWA): Wajib menampilkan **Fixed Bottom Navigation Bar** dengan tombol aksi utama Scan/Log di tengah dan memperhatikan `pb-[env(safe-area-inset-bottom)]` untuk layar iOS modern. Sidebar desktop harus disembunyikan (`hidden md:flex`).
  - Pada layar `>= 768px` (tablet/desktop): Menampilkan **Left Sidebar Navigation** dan menyembunyikan Bottom Navigation Bar (`md:hidden`).
- **Integritas Data & Bahasa (v1.1):** Dilarang menaruh data contoh/dummy, akun demo, atau nilai fallback angka di jalur produksi (`apps/frontend/src`); gunakan skeleton, *empty state*, dan pesan galat. Frontend tidak boleh membuat sesi otomatis. UI berbahasa Indonesia (sapaan "kamu") mengikuti glosarium `docs/DESIGN.md` §7; jargon teknis hanya di blok "Detail teknis". Tanggal "hari ini" dihitung lewat `lib/date.ts` (zona waktu pengguna), bukan `toISOString()`.
- **Theming:** Semua komponen wajib mendukung **Light Mode** dan **Dark Mode** secara mulus menggunakan CSS variables Tailwind / Shadcn UI (`bg-background`, `text-foreground`, `bg-card`, `text-primary`, dll.), hindari *hardcoded hex color* yang merusak kontras di salah satu tema.
- **Image Optimization sebelum Upload:** Semua foto makanan yang diambil dari kamera/galeri HP pengguna harus dikompresi di sisi client (`maxWidthOrHeight: 1280`, format `image/webp` atau `image/jpeg`, `quality: 0.8`) sebelum dikirim ke `apps/backend` agar waktu scan cepat (< 3 detik) dan hemat bandwidth/storage.

---

## 5. Workflow Agile untuk AI Agent & Developer

Setiap kali mengerjakan task di repositori ini, ikuti siklus 5 langkah berikut:

1. **Periksa Backlog & Status Terkini:**
   Baca [`docs/SPRINT.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/SPRINT.md) dan [`docs/PROGRESS_TRACKER.md`](file:///d:/CODING/PROJECT/nutrisnap/docs/PROGRESS_TRACKER.md) untuk mengidentifikasi task berikutnya dalam urutan Sprint.
2. **Tandai Task `IN_PROGRESS`:**
   Perbarui status task yang sedang dikerjakan di `docs/PROGRESS_TRACKER.md` menjadi `IN_PROGRESS`.
3. **Implementasi Sesuai Spesifikasi:**
   Ikuti kontrak API di `docs/API_CONTRACT.md`, desain database di `docs/ARCHITECTURE.md`, dan panduan komponen di `docs/DESIGN.md`.
4. **Verifikasi & Pengujian:**
   Pastikan tidak ada error TypeScript (`pnpm typecheck`), linter bersih (`pnpm lint`), dan unit test / build berjalan sukses (`pnpm test` / `pnpm build`).
5. **Update Progress Tracker & Dokumentasi:**
   Setelah selesai dan terverifikasi, ubah status task di `docs/PROGRESS_TRACKER.md` menjadi `DONE`, catat tanggal/ringkasan pada bagian Changelog, dan sinkronkan `docs/API_CONTRACT.md` atau `docs/ARCHITECTURE.md` jika terdapat penyesuaian teknis.

