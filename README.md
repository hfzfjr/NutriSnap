# NutriSnap — AI-Powered Nutrition, Bulking & Diet Tracker PWA

**NutriSnap** adalah aplikasi web multi-pengguna berbasis **Progressive Web App (PWA)** untuk pelacakan nutrisi harian, pemindaian foto makanan menggunakan **Google Gemini Multimodal**, pemantauan program *bulking* (surplus kalori) maupun *cutting/diet* (defisit kalori), serta asisten chatbot nutrisi dengan dukungan **BYOK (Bring Your Own Key)** terenkripsi `AES-256-GCM`.

---

## Struktur Monorepo

```text
nutrisnap/
├── AGENTS.md                  # Panduan utama AI Agents & Konvensi Engineering
├── docs/                      # Dokumentasi Agile, PRD, Design System, Architecture, API
├── apps/
│   ├── frontend/              # Next.js (App Router), Tailwind CSS, Shadcn UI, PWA (<768px Bottom Nav)
│   └── backend/               # Fastify TypeScript API Server, Drizzle ORM, AES-256-GCM Vault, Gemini AI
├── packages/
│   └── shared/                # Shared Zod Schemas, DTO Types, & Rumus Kalkulasi Nutrisi
├── docker-compose.coolify.yml # Orkestrasi Full-Stack untuk Coolify Home Server
└── pnpm-workspace.yaml
```

---

## Dokumentasi Proyek (`/docs`)

- [AGENTS.md](./AGENTS.md) — Panduan Engineering & Protokol AI Agent
- [docs/PRD.md](./docs/PRD.md) — Product Requirements Document & Rumus Nutrisi
- [docs/DESIGN.md](./docs/DESIGN.md) — Design System, Color Tokens, & Responsive Layout (`<768px` Bottom Nav)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Arsitektur Coolify, Database ERD, & Keamanan BYOK
- [docs/API_CONTRACT.md](./docs/API_CONTRACT.md) — Spesifikasi REST API & Gemini Structured Schema
- [docs/SPRINT.md](./docs/SPRINT.md) — Rencana Sprint Agile (Sprint 0 – Sprint 5)
- [docs/PROGRESS_TRACKER.md](./docs/PROGRESS_TRACKER.md) — Live Agile Progress Board

---

## Perintah Utama (pnpm Workspace)

```bash
# Install seluruh dependensi monorepo
pnpm install

# Menjalankan unit test (rumus nutrisi & validasi)
pnpm test

# Memeriksa tipe TypeScript di seluruh workspace
pnpm typecheck

# Build seluruh paket dan aplikasi
pnpm build

# Menjalankan development server (Frontend :3000 & Backend :4000)
pnpm dev
```
