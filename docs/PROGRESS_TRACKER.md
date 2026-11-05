# Agile Progress Tracker (PROGRESS_TRACKER.md) — NutriSnap

> **Current Active Sprint:** Sprint 1 — Auth, Personalization Onboarding & BYOK Vault  
> **Overall Project Completion:** `21 / 98 Story Points (21.4%)`  
> **Last Updated:** 2026-11-06

---

## 1. Sprint Velocity & Summary Dashboard

| Sprint | Nama Sprint | Story Points (Done / Total) | Progress | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Sprint 0** | Foundation, Agile Docs, Monorepo & Database | `16 / 16 SP` | `100.0%` | 🟢 `DONE` |
| **Sprint 1** | Auth, Personalization Onboarding & BYOK Vault | `5 / 21 SP` | `23.8%` | 🟡 `IN_PROGRESS` |
| **Sprint 2** | Dual Nutrition Logging (AI Vision + Manual Gram) | `0 / 24 SP` | `0.0%` | ⚪ `TODO` |
| **Sprint 3** | Interactive Dashboard, Responsive Nav & Analytics | `0 / 18 SP` | `0.0%` | ⚪ `TODO` |
| **Sprint 4** | AI Bulking & Diet Assistant Chatbot | `0 / 13 SP` | `0.0%` | ⚪ `TODO` |
| **Sprint 5** | PWA, Scheduled Meal Push Notifications & Coolify | `0 / 16 SP` | `0.0%` | ⚪ `TODO` |
| **TOTAL** | **Seluruh Proyek NutriSnap** | **`21 / 98 SP`** | **`21.4%`** | 🟡 **`ACTIVE`** |

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
- [/] **`NS-102`** (5 SP) — Implementasi Google OAuth 2.0 Authentication & Session Management (`auth` module + middleware) — **IN_PROGRESS**
- [ ] **`NS-103`** (5 SP) — Endpoint & UI manajemen BYOK Gemini API Key (`/api/v1/apikey` + live validation ke Google Gemini API) — **TODO**
- [ ] **`NS-104`** (6 SP) — Endpoint & Multi-step UI Wizard `/onboarding` (Input Nama, Usia, Tinggi, Berat, Gender, Target Berat, Target Bulan/Tahun -> Kalkulasi BMI, TDEE, Kalori & Protein) — **TODO**

### Sprint 2: Dual Nutrition Logging (AI Food Photo Scanner & Manual Input)
- [ ] **`NS-201`** (3 SP) — Utilitas kompresi gambar di browser (`<= 1280px`, WebP/JPEG) untuk mempercepat upload dari kamera HP — **TODO**
- [ ] **`NS-202`** (8 SP) — Service Gemini Multimodal Food Vision (`POST /api/v1/meals/scan-photo`) dengan `responseSchema` JSON terstruktur — **TODO**
- [ ] **`NS-203`** (5 SP) — Service Kalkulator Makro Manual (`POST /api/v1/meals/estimate-manual`) menggunakan DB makanan lokal + fallback Gemini — **TODO**
- [ ] **`NS-204`** (3 SP) — Endpoint CRUD Meal Logs (`POST /api/v1/meals`, `GET /api/v1/meals/daily`, `DELETE /api/v1/meals/:id`) — **TODO**
- [ ] **`NS-205`** (5 SP) — Halaman `/log` Dual Logger UI: Tab 1 (AI Camera Scanner + Editable Confirmation Card) & Tab 2 (Manual Input + Berat Gram) — **TODO**

### Sprint 3: Interactive Dashboard, Responsive Navigation (`<768px`) & Analytics
- [ ] **`NS-301`** (5 SP) — Responsive App Shell: Fixed Bottom Navbar pada `< 768px` (dengan tombol tengah Scan/Log) & Sidebar pada `>= 768px` — **TODO**
- [ ] **`NS-302`** (8 SP) — Halaman `/dashboard`: Calorie Ring, Surplus/Deficit Status Tracker, Macro Progress Bars (Protein/Carbs/Fat), & Daily Meal Timeline — **TODO**
- [ ] **`NS-303`** (5 SP) — Halaman `/analytics`: Pencatatan berat badan berkala (`weight_logs`), BMI Tracker, & grafik kepatuhan kalori mingguan — **TODO**

### Sprint 4: Contextual AI Bulking & Diet Assistant Chatbot
- [ ] **`NS-401`** (5 SP) — Backend AI Diet Coach (`POST /api/v1/chat/message` & `GET /api/v1/chat/history`) dengan injeksi dinamis profil BMR/TDEE & sisa kalori/protein hari ini — **TODO**
- [ ] **`NS-402`** (5 SP) — Halaman `/chat`: Antarmuka Chatbot modern dengan *Quick Prompt Chips*, dukungan Markdown, dan indikator *status konteks nutrisi* — **TODO**
- [ ] **`NS-403`** (3 SP) — Penanganan *graceful fallback* & pesan panduan ramah jika BYOK API Key pengguna belum diatur atau mencapai kuota limit — **TODO**

### Sprint 5: PWA, Scheduled Push Notifications & Coolify Production Readiness
- [ ] **`NS-501`** (5 SP) — Konfigurasi PWA (`manifest.ts`, ikon multi-ukuran, Apple PWA meta tags, Service Worker `public/sw.js`, & Install Banner) — **TODO**
- [ ] **`NS-502`** (5 SP) — Modul Web Push VAPID (`/api/v1/notifications/*`) & Cron Scheduler (`meal-reminder.job.ts`) untuk mengecek makan harian yang belum di-log — **TODO**
- [ ] **`NS-503`** (3 SP) — Halaman `/settings` lengkap: Manajemen BYOK API Key, Edit Target Berat/Kalori, Pengaturan Jam Push Notification, & Toggle Light/Dark Mode — **TODO**
- [ ] **`NS-504`** (3 SP) — Pembuatan `Dockerfile` (`apps/frontend` & `apps/backend`), `docker-compose.coolify.yml`, `.env.example`, dan pengujian build End-to-End — **TODO**

---

## 3. Changelog & Activity Log

| Tanggal | Task ID | Ringkasan Aktivitas | Oleh |
| :--- | :--- | :--- | :--- |
| `2026-11-06` | `NS-001` | Merampungkan review arsitektur Monorepo Full Coolify serta membuat `AGENTS.md` (di root) dan suite dokumentasi Agile (`PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `SPRINT.md`, `PROGRESS_TRACKER.md`) di dalam `/docs`. | Principal Architect Agent |
| `2026-11-06` | `NS-002`, `NS-003`, `NS-004`, `NS-005` | Menyelesaikan seluruh **Sprint 0**: Inisialisasi `pnpm` workspace monorepo, implementasi `@nutrisnap/shared` (BMI, BMR Mifflin-St Jeor, TDEE, Surplus/Deficit Engine, Zod Schemas + 6 Unit Tests), setup `@nutrisnap/backend` (Fastify + Drizzle PostgreSQL Schema 9 tabel + Katalog 25 Makanan Lokal Indonesia + 2 Integration Tests), serta setup `@nutrisnap/frontend` (Next.js 15 App Router, Shadcn Design System Light/Dark, Responsive Bottom Nav `<768px` & Desktop Sidebar `>=768px`, PWA Manifest). Seluruh `pnpm test`, `pnpm typecheck`, dan `pnpm build` lulus 100%. | Principal Architect Agent |
