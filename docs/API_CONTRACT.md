# API Contract & Integration Specification (API_CONTRACT.md) — NutriSnap

> **Base URL (Internal Coolify Network):** `http://backend:4000/api/v1`  
> **Base URL (Browser / Reverse Proxy):** `https://<domain>/api/v1`  
> **Authentication:** `HttpOnly` Session Cookie (`nutrisnap_session`) atau `Authorization: Bearer <token>`  
> **Shared Validation Package:** `@nutrisnap/shared`

---

## 1. Standar Amplop Respons (*Standard Response Envelope*)

Seluruh endpoint di `apps/backend` mengembalikan struktur JSON yang seragam:

### Sukses (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-06T00:00:00.000Z"
  }
}
```

### Gagal (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "GEMINI_KEY_MISSING",
    "message": "Silakan masukkan Google Gemini API Key Anda di halaman Settings terlebih dahulu.",
    "details": []
  }
}
```

---

## 2. Daftar Endpoint per Modul

### 2.1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Deskripsi | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/auth/google` | Menginisiasi alur login Google OAuth 2.0 | Tidak |
| `GET` | `/api/v1/auth/google/callback` | Callback Google OAuth, membuat/memperbarui user & mengatur cookie sesi | Tidak |
| `POST` | `/api/v1/auth/google/token` | Verifikasi Google ID Token / OAuth payload dari Frontend | Tidak |
| `GET` | `/api/v1/auth/me` | Mengambil data user aktif + status `onboardingCompleted` & status `hasApiKey` | **Ya** |
| `POST` | `/api/v1/auth/logout` | Menghapus sesi login pengguna | **Ya** |

---

### 2.2. Onboarding & User Profile (`/api/v1/profile`)

#### `POST /api/v1/profile/onboarding`
Menyimpan kuesioner personalisasi awal dan menghitung BMI, BMR, Maintenance Calories (TDEE), Target Kalori/Protein harian, serta status Surplus/Defisit.

- **Request Body:**
```json
{
  "name": "Raka Pratama",
  "gender": "male",
  "age": 22,
  "heightCm": 172,
  "currentWeightKg": 58.5,
  "targetWeightKg": 66.0,
  "targetTimelineMonths": 5,
  "activityLevel": "moderate",
  "timezone": "Asia/Jakarta"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "gender": "male",
      "age": 22,
      "heightCm": 172,
      "currentWeightKg": 58.5,
      "targetWeightKg": 66.0,
      "targetTimelineMonths": 5,
      "activityLevel": "moderate",
      "goalType": "bulking",
      "bmiScore": 19.77,
      "bmiCategory": "normal",
      "bmrCalories": 1558,
      "maintenanceCalories": 2415,
      "dailyCalorieDelta": 385,
      "targetDailyCalories": 2800,
      "targetDailyProteinG": 117,
      "targetDailyCarbsG": 365,
      "targetDailyFatG": 78,
      "onboardingCompleted": true
    }
  }
}
```

#### `GET /api/v1/profile`
Mengambil profil nutrisi lengkap beserta riwayat log berat badan (`weight_logs`).

#### `POST /api/v1/profile/weight`
Mencatat berat badan terbaru pengguna dan memperbarui skor BMI secara otomatis.

#### `DELETE /api/v1/profile/weight/:id`
Menghapus riwayat catatan berat badan tertentu milik pengguna.

---

### 2.3. BYOK Gemini API Key Vault (`/api/v1/apikey`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/apikey/status` | Mengambil status kunci (`hasKey`, `isValid`, `keyHint`, `preferredModel`) tanpa pernah mengembalikan plaintext key |
| `PUT` | `/api/v1/apikey` | Memvalidasi API key ke server Google Gemini, mengenkripsi dengan `AES-256-GCM`, dan menyimpannya di DB |
| `DELETE` | `/api/v1/apikey` | Menghapus API key terenkripsi milik pengguna dari database |

- **Request `PUT /api/v1/apikey`:**
```json
{
  "apiKey": "AIzaSyD-EXAMPLE-USER-PERSONAL-KEY",
  "preferredModel": "gemini-2.5-flash"
}
```
- **Response `PUT /api/v1/apikey` (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "hasKey": true,
    "isValid": true,
    "keyHint": "AIza...L-KEY",
    "preferredModel": "gemini-2.5-flash",
    "lastVerifiedAt": "2026-11-06T00:10:00.000Z"
  }
}
```

---

### 2.4. Dual Nutrition Logging (`/api/v1/meals`)

#### 1. `POST /api/v1/meals/scan-photo` (AI Food Photo Scanner — Gemini Multimodal)
Menerima gambar terkompresi (Base64 data URL atau Multipart), mendekripsi BYOK user di memori backend, dan memanggil Gemini Multimodal dengan `responseSchema` terstruktur.

- **Request Body:**
```json
{
  "imageBase64": "data:image/webp;base64,UklGR...",
  "mealType": "lunch",
  "userContextNote": "Nasi padang pakai ayam bakar dada dan daun singkong"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "mealTitle": "Nasi Padang Ayam Bakar Dada & Sayur Singkong",
    "items": [
      {
        "foodName": "Nasi Putih",
        "weightGrams": 200,
        "calories": 260,
        "proteinG": 5.4,
        "carbsG": 56.0,
        "fatG": 0.6,
        "confidence": 0.94
      },
      {
        "foodName": "Ayam Bakar Bagian Dada",
        "weightGrams": 150,
        "calories": 248,
        "proteinG": 45.0,
        "carbsG": 2.1,
        "fatG": 5.8,
        "confidence": 0.91
      },
      {
        "foodName": "Rebusan Daun Singkong & Kuah Sedikit",
        "weightGrams": 80,
        "calories": 65,
        "proteinG": 2.8,
        "carbsG": 7.5,
        "fatG": 3.2,
        "confidence": 0.86
      }
    ],
    "totals": {
      "calories": 573,
      "proteinG": 53.2,
      "carbsG": 65.6,
      "fatG": 9.6
    },
    "nutritionNotes": "Tinggi protein (53.2g)! Sangat mendukung target bulking Anda hari ini."
  }
}
```

#### 2. `POST /api/v1/meals/estimate-manual` (AI/Database Macro Calculator untuk Input Manual)
Digunakan pada form manual ketika pengguna hanya memasukkan **Nama Makanan** dan **Berat (gram)** lalu ingin menghitung kalori & protein secara otomatis.

- **Request Body:**
```json
{
  "foodName": "Tempe Goreng",
  "weightGrams": 120
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "foodName": "Tempe Goreng",
    "weightGrams": 120,
    "calories": 240,
    "proteinG": 21.6,
    "carbsG": 12.5,
    "fatG": 13.8,
    "source": "local_db"
  }
}
```

#### 3. `POST /api/v1/meals` (Commit & Simpan Meal Log ke Database)
Menyimpan hasil AI Photo Scanner (yang sudah dikonfirmasi pengguna) maupun hasil Manual Input Form ke dalam tabel `meal_logs` dan `meal_items`.

- **Request Body:**
```json
{
  "loggedDate": "2026-11-06",
  "mealType": "lunch",
  "source": "ai_scan",
  "title": "Nasi Padang Ayam Bakar Dada",
  "aiNotes": "Tinggi protein (53.2g)!",
  "items": [
    {
      "foodName": "Nasi Putih",
      "weightGrams": 200,
      "calories": 260,
      "proteinG": 5.4,
      "carbsG": 56.0,
      "fatG": 0.6
    },
    {
      "foodName": "Ayam Bakar Bagian Dada",
      "weightGrams": 150,
      "calories": 248,
      "proteinG": 45.0,
      "carbsG": 2.1,
      "fatG": 5.8
    }
  ]
}
```

#### 4. `GET /api/v1/meals/daily?date=YYYY-MM-DD`
Mengambil seluruh log makanan pada tanggal tertentu beserta ringkasan total kalori, protein, karbohidrat, lemak, dan status *Surplus / Deficit* dibandingkan target profil pengguna.

#### 5. `PATCH /api/v1/meals/:id`
Memperbarui informasi catatan makan tertentu (`title`, `mealType`, `aiNotes`).

#### 6. `DELETE /api/v1/meals/:id`
Menghapus catatan makan tertentu milik pengguna.

---

### 2.5. AI Bulking & Diet Assistant Chatbot (`/api/v1/chat`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/history` | Mengambil riwayat percakapan antara user dan AI Nutrition Coach |
| `POST` | `/api/v1/chat/message` | Mengirim pesan ke Gemini dengan injeksi otomatis konteks tubuh & progres makan hari ini |
| `DELETE` | `/api/v1/chat/history` | Mereset/membersihkan riwayat percakapan |

- **Request `POST /api/v1/chat/message`:**
```json
{
  "message": "Malam ini saya masih kurang 550 kalori dan 35 gram protein untuk mencapai target bulking. Sebaiknya makan apa yang praktis?"
}
```

---

### 2.6. PWA Push Notifications (`/api/v1/notifications`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notifications/vapid-public-key` | Mengambil VAPID Public Key untuk `pushManager.subscribe` di Service Worker |
| `POST` | `/api/v1/notifications/subscribe` | Menyimpan subscription perangkat & preferensi jam pengingat makan (`breakfastTime`, `lunchTime`, `dinnerTime`) |
| `PUT` | `/api/v1/notifications/preferences` | Mengubah jam pengingat makan atau menonaktifkan pengingat |
| `POST` | `/api/v1/notifications/test` | Mengirimkan *Test Push Notification* instan ke perangkat pengguna untuk verifikasi |

