<div align="center">

# 🥗 NutriSnap

### **AI-Powered Nutrition, Bulking & Diet Tracker PWA**
*Snap Your Plate. Hit Your Macros.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Backend-Fastify_5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle_+_PostgreSQL_16-C5F74F?logo=postgresql&logoColor=black)](https://orm.drizzle.team/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini_2.5_Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Coolify](https://img.shields.io/badge/Deploy-Coolify_Self--Hosted-6B46C1?logo=docker&logoColor=white)](https://coolify.io/)

</div>

---

## 📖 Tentang NutriSnap

**NutriSnap** adalah aplikasi web multi-pengguna (*multi-user*) berbasis **Progressive Web App (PWA)** untuk pelacakan nutrisi harian, pemindaian foto makanan otomatis menggunakan **Google Gemini Multimodal AI**, pemantauan program **Bulking** (*caloric surplus*) maupun **Cutting / Diet** (*caloric deficit*), serta asisten chatbot nutrisi personal.

Aplikasi ini dirancang menggunakan arsitektur **Full-Stack TypeScript Monorepo** yang dioptimalkan untuk deployment mandiri (*self-hosted*) di **Coolify** guna menghasilkan latensi internal `< 1ms` antar-layanan, lengkap dengan sistem keamanan **BYOK (Bring Your Own Key)** terenkripsi `AES-256-GCM`.

---

## ✨ Fitur Utama

1. **📸 Dual Nutrition Logging (AI Vision + Manual Input)**
   - **AI Food Photo Scanner:** Ambil foto makanan dari kamera HP/galeri; gambar dikompresi otomatis di sisi client (`<= 1280px`) dan dianalisis oleh **Google Gemini Multimodal** (`responseSchema` JSON terstruktur) untuk mengekstrak daftar komponen makanan, estimasi gramasi, kalori (`kcal`), protein (`g`), karbohidrat (`g`), dan lemak (`g`).
   - **Manual Input Form:** Catat makanan secara cepat cukup dengan memasukkan **nama makanan** dan **berat dalam gram**, didukung katalog makanan populer Indonesia & kebugaran.

2. **🎯 Onboarding & Kalkulator Personalisasi Presisi**
   - Mengumpulkan data fisik (usia, tinggi badan, berat badan saat ini, jenis kelamin, tingkat aktivitas) serta **target berat badan** dan **target durasi (bulan/tahun)**.
   - Menghitung secara otomatis:
     - **Skor & Kategori BMI** (WHO Standard)
     - **Basal Metabolic Rate (BMR)** via persamaan *Mifflin-St Jeor*
     - **Maintenance Calories (TDEE)**
     - **Target Kalori & Protein Harian** beserta pelacak status **Surplus / Defisit** real-time dan *Health Safety Guardrails*.

3. **🔐 BYOK (Bring Your Own Key) dengan Vault Enkripsi `AES-256-GCM`**
   - Setiap pengguna dapat memasukkan Google Gemini API Key pribadi mereka melalui menu **Settings**.
   - Kunci dienkripsi di sisi server menggunakan `AES-256-GCM` (12-byte random IV unik & 16-byte Authentication Tag) dan disimpan dalam format `iv:authTag:ciphertext`. Plaintext key **tidak pernah** diekspos kembali ke browser atau log.

4. **🤖 Dedicated AI Bulking & Diet Assistant Chatbot**
   - Asisten chatbot khusus konsultasi strategi *bulking*, *cutting*, rekomendasi menu tinggi protein, dan evaluasi makro yang secara otomatis memahami profil tubuh serta sisa target kalori/protein harian pengguna.

5. **📱 Mobile-First UX, Light/Dark Mode & PWA Push Notifications**
   - **Responsive Navigation:** Menggunakan **Fixed Bottom Navigation Bar** pada layar `< 768px` (dengan tombol tengah **Scan/Log** menonjol & dukungan iOS safe-area) dan **Left Sidebar** pada layar `>= 768px`.
   - **Dual Theme:** Mendukung **Light Mode** dan **Dark Mode** secara mulus.
   - **Installable PWA & Scheduled Reminders:** Dapat di-install ke *Home Screen* iOS & Android dan mengirimkan **Web Push Notification (VAPID)** terjadwal apabila pengguna belum mencatat makan pada jam sarapan, makan siang, atau makan malam.

---

## 🏗️ Arsitektur Monorepo & Tech Stack

| Layer | Teknologi |Lokasi Workspace |
| :--- | :--- | :--- |
| **Frontend & PWA** | Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI, `next-themes`, Lucide Icons | [`apps/frontend`](./apps/frontend) |
| **Backend API & Cron** | Node.js, Fastify 5 (TypeScript Strict), `@google/genai`, `node-cron`, `web-push`, `node:crypto` (`AES-256-GCM`) | [`apps/backend`](./apps/backend) |
| **Database & Storage** | PostgreSQL 16, Drizzle ORM, Drizzle Kit, Local Volume / S3-Compatible Storage | [`apps/backend/src/db`](./apps/backend/src/db) |
| **Shared Contracts** | Zod Validation Schemas, DTO Types, & Pure Nutrition Calculation Engine (BMI, BMR, TDEE, Macros) | [`packages/shared`](./packages/shared) |

```text
nutrisnap/
├── AGENTS.md                  # Panduan utama AI Coding Agents & Konvensi Engineering
├── docs/                      # Dokumentasi Agile, PRD, Design System, Architecture, API
│   ├── PRD.md                 # Product Requirements Document & Rumus Bisnis Nutrisi
│   ├── DESIGN.md              # UI/UX Design System, Color Tokens, & Responsive Layout (<768px)
│   ├── ARCHITECTURE.md        # Arsitektur Coolify, Database ERD, & Keamanan BYOK
│   ├── API_CONTRACT.md        # Kontrak Endpoint REST API Frontend <-> Backend
│   ├── SPRINT.md              # Roadmap & Backlog Agile Scrum (Sprint 0 – Sprint 5)
│   └── PROGRESS_TRACKER.md    # Live Agile Progress Board & Changelog
├── apps/
│   ├── frontend/              # Aplikasi Web & PWA Next.js (Port 3000)
│   └── backend/               # Server API Fastify + Drizzle ORM + Scheduler (Port 4000)
├── packages/
│   └── shared/                # Paket bersama (@nutrisnap/shared)
├── docker-compose.coolify.yml # Orkestrasi produksi untuk Coolify Home Server
├── pnpm-workspace.yaml        # Konfigurasi pnpm Monorepo
└── tsconfig.base.json         # Konfigurasi dasar TypeScript Strict Mode
```

---

## 🚀 Panduan Memulai (Local Development)

### 1. Prasyarat
- **Node.js** `>= 20.0.0` (Direkomendasikan `v22 LTS` atau `v24`)
- **pnpm** `>= 9.0.0` (Aktifkan melalui `corepack enable`)
- **PostgreSQL** `>= 15` (Lokal atau melalui Docker)

### 2. Instalasi & Konfigurasi Environment
```bash
# 1. Clone repositori
git clone https://github.com/hfzfjr/NutriSnap.git
cd NutriSnap

# 2. Salin file environment variable contoh
cp .env.example .env

# 3. Install seluruh dependensi monorepo
pnpm install
```

### 3. Generate Kunci Enkripsi & VAPID (Opsional untuk Produksi)
```bash
# Generate 32-byte (64 hex chars) untuk ENCRYPTION_MASTER_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate VAPID Public & Private Keys untuk Web Push Notifications
npx web-push generate-vapid-keys
```

### 4. Menjalankan Aplikasi & Pengujian
```bash
# Build paket kontrak bersama (@nutrisnap/shared)
pnpm --filter @nutrisnap/shared build

# Menjalankan database migration ke PostgreSQL
pnpm db:migrate

# Menjalankan development server secara paralel (Frontend :3000 & Backend :4000)
pnpm dev

# Menjalankan unit & integration tests (Vitest)
pnpm test

# Memeriksa validitas tipe TypeScript di seluruh workspace
pnpm typecheck

# Build produksi penuh untuk seluruh aplikasi
pnpm build
```

---

## 🐳 Deployment ke Coolify (Self-Hosted)

Proyek ini telah dilengkapi dengan [`docker-compose.coolify.yml`](./docker-compose.coolify.yml) serta multi-stage `Dockerfile` di [`apps/frontend/Dockerfile`](./apps/frontend/Dockerfile) dan [`apps/backend/Dockerfile`](./apps/backend/Dockerfile).

1. Buka dashboard **Coolify** Anda dan buat resource baru bertipe **Docker Compose** dari repositori Git ini.
2. Arahkan **Docker Compose Location** ke `/docker-compose.coolify.yml`.
3. Isi variabel lingkungan wajib pada tab **Environment Variables** di Coolify (lihat daftar lengkap di [`.env.example`](./.env.example)):
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `ENCRYPTION_MASTER_KEY` *(Wajib 64 karakter hex)*
   - `SESSION_SECRET` *(Minimal 32 karakter)*
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
4. Hubungkan domain HTTPS Anda ke service `frontend` (port `3000`) dan `backend` (port `4000`), lalu klik **Deploy**.

---

## 📚 Peta Dokumentasi Engineering (`/docs`)

Seluruh pengembangan fitur mengikuti metodologi Agile Scrum yang terdokumentasi di dalam folder [`/docs`](./docs):

| Dokumen | Ringkasan Isi |
| :--- | :--- |
| [**`AGENTS.md`**](./AGENTS.md) | Panduan aturan engineering, batas modul monorepo, standar keamanan BYOK, & workflow AI Agent |
| [**`docs/PRD.md`**](./docs/PRD.md) | Product Requirements Document, User Personas, Rumus BMI/BMR/TDEE/Surplus, & Acceptance Criteria |
| [**`docs/DESIGN.md`**](./docs/DESIGN.md) | Spesifikasi Design System lengkap (Color Tokens Light/Dark, Typography, `<768px` Bottom Nav, Wireframes) |
| [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) | Arsitektur Jaringan Internal Coolify, Skema Database ERD (9 Tabel), & Pipeline Gemini Multimodal |
| [**`docs/API_CONTRACT.md`**](./docs/API_CONTRACT.md) | Spesifikasi Endpoint REST API (`/api/v1/*`), Amplop Respons, & Skema JSON Gemini |
| [**`docs/SPRINT.md`**](./docs/SPRINT.md) | Rencana Sprint Agile (`Sprint 0` s/d `Sprint 5`), Story Points, & Definition of Done |
| [**`docs/PROGRESS_TRACKER.md`**](./docs/PROGRESS_TRACKER.md) | Papan pelacakan status pengerjaan task (`TODO`, `IN_PROGRESS`, `DONE`) & Changelog |
