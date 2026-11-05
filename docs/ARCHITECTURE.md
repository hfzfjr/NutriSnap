# System Architecture & Infrastructure Blueprint (ARCHITECTURE.md) — NutriSnap

> **Architectural Pattern:** Modular TypeScript Monorepo (`apps/frontend`, `apps/backend`, `packages/shared`)  
> **Deployment Model:** Self-Hosted Single-Node / Docker Network on **Coolify**  
> **Database & Storage:** PostgreSQL 16 + S3-Compatible Storage (MinIO / Local Volume)

---

## 1. High-Level System Topology (Full Coolify Deployment)

Dengan menempatkan seluruh stack di dalam satu server **Coolify**, komunikasi antar-container (`frontend` <-> `backend` <-> `postgres` <-> `storage`) berjalan di atas jaringan bridge Docker internal dengan *network latency* `< 1ms`, tanpa biaya bandwidth cloud eksternal dan tanpa batas payload serverless 4.5MB.

```mermaid
flowchart TB
    subgraph ClientDevices["Perangkat Pengguna (Mobile PWA <768px & Desktop)"]
        Browser["Next.js PWA Client\n(Service Worker + Web Push + Image Compressor)"]
    end

    subgraph Edge["Ingress & TLS Layer"]
        Proxy["Coolify Reverse Proxy (Traefik / Cloudflare Tunnel)\nHTTPS / TLS 1.3 Termination"]
    end

    subgraph CoolifyDockerNetwork["Coolify Internal Docker Network (nutrisnap-net)"]
        FE["apps/frontend\nNext.js App Router (Standalone)\nPort: 3000"]
        BE["apps/backend\nNode.js TypeScript API + Cron Worker\nPort: 4000"]
        PG[("PostgreSQL 16\nDatabase Utama\nPort: 5432")]
        S3[("MinIO / Local Storage\nFood Photo Bucket\nPort: 9000")]
    end

    subgraph ExternalServices["External APIs"]
        GoogleOAuth["Google OAuth 2.0"]
        Gemini["Google Gemini API\n(gemini-2.5-flash Multimodal & Chat)"]
        PushService["FCM / Apple Push Notification Service\n(Web Push Protocol)"]
    end

    Browser <-->|"HTTPS"| Proxy
    Proxy -->|"/"| FE
    Proxy -->|"/api/v1/*"| BE
    FE <-->|"< 1ms Internal HTTP"| BE
    BE <-->|"< 1ms TCP Pool"| PG
    BE <-->|"< 1ms S3 API"| S3
    BE <-->|"OAuth Verify"| GoogleOAuth
    BE <-->|"Decrypted BYOK (In-Memory)"| Gemini
    BE -->|"VAPID Web Push"| PushService
    PushService -->|"Wake Service Worker"| Browser
```

---

## 2. Monorepo Directory Structure

```text
nutrisnap/
├── AGENTS.md                        # Panduan utama AI Agents & Konvensi Kode
├── docs/                            # Dokumentasi Produk, Desain, Arsitektur, & Agile
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── SPRINT.md
│   └── PROGRESS_TRACKER.md
├── apps/
│   ├── frontend/                    # Next.js 15+ (App Router), Tailwind CSS, Shadcn UI, PWA
│   │   ├── public/
│   │   │   ├── icons/               # PWA App Icons (192, 512, maskable)
│   │   │   └── sw.js                # Service Worker untuk Web Push & Caching
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/login/
│   │   │   │   ├── (onboarding)/onboarding/
│   │   │   │   ├── (app)/
│   │   │   │   │   ├── layout.tsx   # Responsive Shell (BottomNav <768px & Sidebar >=768px)
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── log/
│   │   │   │   │   ├── chat/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   └── settings/
│   │   │   │   └── manifest.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/              # Shadcn UI Primitives
│   │   │   │   ├── layout/          # BottomNav, DesktopSidebar, ThemeToggle
│   │   │   │   ├── nutrition/       # CalorieRing, SurplusBadge, AiFoodScanner, ManualFoodForm
│   │   │   │   ├── chat/            # DietChatbot
│   │   │   │   └── pwa/             # InstallPrompt, PushNotificationManager
│   │   │   └── lib/
│   │   │       ├── api-client.ts    # Typed HTTP Client ke apps/backend
│   │   │       └── image-compress.ts# Client-side Canvas WebP/JPEG Resizer (<=1280px)
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/                     # Node.js TypeScript Backend API + Scheduler
│       ├── src/
│       │   ├── config/
│       │   │   └── env.ts           # Validasi Zod untuk seluruh Environment Variables
│       │   ├── crypto/
│       │   │   └── vault.ts         # AES-256-GCM Encryption & Decryption untuk BYOK
│       │   ├── db/
│       │   │   ├── index.ts         # Koneksi PostgreSQL Pool + Drizzle ORM
│       │   │   ├── schema.ts        # Definisi Tabel & Relasi Database
│       │   │   └── seed-foods.ts    # Data awal makanan populer Indonesia & umum (per 100g)
│       │   ├── middlewares/
│       │   │   ├── auth.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── modules/
│       │   │   ├── auth/            # Google OAuth 2.0 Verification & JWT/Session Cookie
│       │   │   ├── profile/         # Onboarding, BMI/BMR/TDEE Calculation, Weight History
│       │   │   ├── apikey/          # Simpan, Validasi, & Hapus BYOK Gemini Key
│       │   │   ├── meals/           # AI Photo Scan, Manual Gram Input, & Daily Summary
│       │   │   ├── chat/            # Contextual Bulking/Diet Chatbot via Gemini
│       │   │   └── notifications/   # VAPID Push Subscription & Cron Meal Reminder
│       │   ├── jobs/
│       │   │   └── meal-reminder.job.ts # Cron setiap 15 menit untuk cek makan belum di-log
│       │   └── index.ts
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── shared/                      # Shared TypeScript Package (@nutrisnap/shared)
│       ├── src/
│       │   ├── nutrition.ts         # Rumus BMI, BMR, TDEE, Surplus/Deficit, Macro Targets
│       │   ├── schemas.ts           # Skema Validasi Zod untuk Request & Response API
│       │   └── index.ts
│       └── package.json
├── docker-compose.coolify.yml       # Production Stack untuk Coolify
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Database Schema (PostgreSQL + Drizzle ORM)

```mermaid
erDiagram
    USERS ||--o| USER_PROFILES : "1:1 profile"
    USERS ||--o| USER_API_KEYS : "1:1 encrypted BYOK"
    USERS ||--o{ MEAL_LOGS : "1:N daily meals"
    MEAL_LOGS ||--|{ MEAL_ITEMS : "1:N food components"
    USERS ||--o{ WEIGHT_LOGS : "1:N weight history"
    USERS ||--o{ CHAT_THREADS : "1:N conversations"
    CHAT_THREADS ||--o{ CHAT_MESSAGES : "1:N messages"
    USERS ||--o{ PUSH_SUBSCRIPTIONS : "1:N devices"

    USERS {
        uuid id PK
        varchar google_id UK
        varchar email UK
        varchar name
        varchar avatar_url
        timestamp created_at
        timestamp updated_at
    }

    USER_PROFILES {
        uuid id PK
        uuid user_id FK
        varchar gender "male | female"
        integer age
        numeric height_cm
        numeric current_weight_kg
        numeric target_weight_kg
        integer target_timeline_months
        varchar activity_level "sedentary | light | moderate | active | very_active"
        varchar goal_type "bulking | cutting | maintenance"
        numeric bmi_score
        varchar bmi_category
        integer bmr_calories
        integer maintenance_calories
        integer daily_calorie_delta "e.g. +400 or -500"
        integer target_daily_calories
        integer target_daily_protein_g
        integer target_daily_carbs_g
        integer target_daily_fat_g
        varchar timezone "Default: Asia/Jakarta"
        boolean onboarding_completed
        timestamp updated_at
    }

    USER_API_KEYS {
        uuid id PK
        uuid user_id FK
        text encrypted_key "Format: ivB64:authTagB64:cipherB64"
        varchar key_hint "e.g. AIza...9xQp"
        varchar preferred_model "Default: gemini-2.5-flash"
        boolean is_valid
        timestamp last_verified_at
        timestamp updated_at
    }

    MEAL_LOGS {
        uuid id PK
        uuid user_id FK
        date logged_date "Index: (user_id, logged_date)"
        varchar meal_type "breakfast | lunch | dinner | snack"
        varchar source "ai_scan | manual"
        varchar title "e.g. Nasi Ayam Bakar & Tempe"
        text image_url "Nullable URL ke Storage Coolify"
        text ai_notes "Catatan/tips nutrisi dari Gemini"
        integer total_calories
        numeric total_protein_g
        numeric total_carbs_g
        numeric total_fat_g
        timestamp logged_at
    }

    MEAL_ITEMS {
        uuid id PK
        uuid meal_log_id FK
        varchar food_name
        numeric weight_grams
        integer calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        numeric confidence_score
    }

    WEIGHT_LOGS {
        uuid id PK
        uuid user_id FK
        date recorded_date
        numeric weight_kg
        numeric bmi_score
        varchar notes
        timestamp created_at
    }

    CHAT_THREADS {
        uuid id PK
        uuid user_id FK
        varchar title
        timestamp updated_at
    }

    CHAT_MESSAGES {
        uuid id PK
        uuid thread_id FK
        varchar role "user | assistant"
        text content
        timestamp created_at
    }

    PUSH_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        text endpoint UK
        varchar p256dh
        varchar auth
        boolean reminder_enabled
        varchar breakfast_time "Default: 08:00"
        varchar lunch_time "Default: 13:00"
        varchar dinner_time "Default: 20:00"
        date last_breakfast_notified
        date last_lunch_notified
        date last_dinner_notified
        timestamp updated_at
    }
```

### Database Indexing Strategy
Untuk menjamin query `< 10ms`:
1. `idx_meal_logs_user_date` pada `meal_logs (user_id, logged_date)` — Mempercepat pengambilan ringkasan kalori/protein harian di Dashboard dan pengecekan *cron job* pengingat makan.
2. `idx_weight_logs_user_date` pada `weight_logs (user_id, recorded_date DESC)` — Mempercepat grafik progres berat badan di halaman Analytics.
3. `idx_chat_messages_thread` pada `chat_messages (thread_id, created_at ASC)` — Mempercepat pemuatan riwayat percakapan AI Coach.

---

## 4. Security Architecture: BYOK AES-256-GCM Encryption Vault

```mermaid
sequenceDiagram
    participant User as User (Frontend)
    participant BE as Backend API (Vault + Gemini Service)
    participant DB as PostgreSQL (user_api_keys)
    participant Gemini as Google Gemini API

    Note over User,DB: 1. Alur Penyimpanan API Key (Settings / Onboarding)
    User->>BE: POST /api/v1/apikey { apiKey: "AIzaSy..." }
    BE->>Gemini: Lightweight Ping (models.get gemini-2.5-flash)
    Gemini-->>BE: 200 OK (Key Valid)
    BE->>BE: Generate 12-byte random IV + AES-256-GCM Encrypt dengan ENCRYPTION_MASTER_KEY
    BE->>DB: UPSERT encrypted_key ("iv:authTag:cipher") & key_hint ("AIza...x9Qp")
    BE-->>User: 200 OK { hasKey: true, isValid: true, keyHint: "AIza...x9Qp" }

    Note over User,Gemini: 2. Alur Pemakaian AI (Food Photo Scan / Chatbot)
    User->>BE: POST /api/v1/meals/analyze-photo (Compressed Image + Session Cookie)
    BE->>DB: SELECT encrypted_key FROM user_api_keys WHERE user_id = $1
    DB-->>BE: "iv:authTag:cipher"
    BE->>BE: Decrypt di RAM -> inisialisasi new GoogleGenAI({ apiKey })
    BE->>Gemini: generateContent (Image + Structured Output Schema)
    Gemini-->>BE: Structured JSON { mealTitle, items: [...], nutritionNotes }
    BE->>BE: Buang referensi plaintext key dari scope memori
    BE-->>User: 200 OK (Hasil Ekstraksi Nutrisi)
```

---

## 5. Multimodal Image Pipeline & Performance Optimization

Untuk mencegah *bottleneck* upload foto kamera smartphone yang besar (5–12 MB):
1. **Tahap 1 — Client-Side Compression (`apps/frontend/src/lib/image-compress.ts`):**
   - Saat user memilih foto dari kamera/galeri, browser menggambar ulang foto ke HTML5 `<canvas>` dengan dimensi sisi terpanjang maksimal **1280px** dan mengekspornya ke `image/webp` (atau `image/jpeg` dengan `quality: 0.82`).
   - Ukuran payload turun **> 95%** (dari ~8 MB menjadi **~150 KB**).
2. **Tahap 2 — Gemini Multimodal Structured Extraction (`apps/backend`):**
   - Backend menerima buffer gambar ~150 KB, mendekripsi API Key user, dan memanggil `ai.models.generateContent` pada model `gemini-2.5-flash` dengan `responseMimeType: "application/json"` dan `responseSchema` ketat.
3. **Tahap 3 — User Review & Storage Commit:**
   - Hasil analisis ditampilkan di UI agar user bisa memverifikasi/mengoreksi gramasi sebelum disimpan ke tabel `meal_logs` dan `meal_items`.

---

## 6. Scheduled Web Push Notification Engine (`meal-reminder.job.ts`)

1. **Pendaftaran Perangkat:**
   - Saat user mengaktifkan pengingat makan di `/settings`, Service Worker (`sw.js`) memanggil `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`.
   - Objek subscription (`endpoint`, `keys.p256dh`, `keys.auth`) beserta jam pengingat (`breakfast_time`, `lunch_time`, `dinner_time`) dikirim ke `POST /api/v1/notifications/subscribe`.
2. **Eksekusi Cron Scheduler di Backend:**
   - Worker internal di `apps/backend` berjalan setiap **15 menit** (`*/15 * * * *`).
   - Untuk setiap subscription aktif (`reminder_enabled = true`):
     1. Hitung waktu dan tanggal lokal pengguna saat ini berdasarkan kolom `timezone` di `user_profiles` (contoh: `Asia/Jakarta`).
     2. Periksa apakah waktu lokal berada dalam rentang `[jam_makan, jam_makan + 45 menit]` dan belum pernah dikirimi notifikasi untuk sesi makan tersebut pada hari ini (`last_<meal>_notified != today`).
     3. Query tabel `meal_logs`: Apakah user sudah mencatat makanan dengan `meal_type` tersebut pada `logged_date = today`?
     4. Jika **belum ada log**, kirimkan Web Push Notification via protokol VAPID:
        - **Judul:** `"Waktunya Makan Siang, Raka! 🍛"`
        - **Isi:** `"Kamu belum mencatat makan siang hari ini. Yuk foto piringmu atau catat manual agar target +400 kcal tercapai!"`
        - **Action URL:** `/log?type=lunch`
     5. Jika endpoint mengembalikan HTTP `410 Gone` (user mencabut izin di browser), hapus subscription tersebut secara otomatis dari database.

