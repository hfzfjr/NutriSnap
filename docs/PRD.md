# Product Requirements Document (PRD) — NutriSnap

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | **NutriSnap** |
| **Versi Dokumen** | 1.0.0 |
| **Status** | Approved for Development |
| **Metodologi** | Agile Scrum |
| **Target Platform** | Web Application (Responsive Mobile & Desktop) + Progressive Web App (PWA iOS & Android) |
| **Infrastruktur** | Self-Hosted Monorepo di Coolify (Home Server) |

---

## 1. Executive Summary & Product Vision

**NutriSnap** adalah aplikasi web multi-pengguna (*multi-user*) berbasis **Progressive Web App (PWA)** untuk pelacakan nutrisi harian, pemantauan program *bulking* (penambahan massa otot/berat badan) maupun *cutting/diet* (penurunan lemak), serta konsultasi nutrisi cerdas berbasis AI.

Masalah terbesar dalam pencatatan kalori konvensional adalah **tingginya friksi pencatatan manual** (pengguna malas menimbang dan mencari satu per satu bahan makanan di tabel nutrisi) serta **biaya langganan aplikasi AI fitness yang mahal**. NutriSnap menyelesaikan kedua masalah ini melalui:
1. **AI Food Photo Scanner & Dual Logging**: Pengguna cukup memotret piring makanannya dan Google Gemini Multimodal secara otomatis mendeteksi daftar komponen makanan, estimasi gramasi, kalori, dan makronutrisi (protein, karbohidrat, lemak), dilengkapi opsi *Manual Input* (nama makanan + berat gram) yang cepat.
2. **Model BYOK (Bring Your Own Key)**: Setiap pengguna dapat memasukkan Google Gemini API Key pribadi mereka yang dienkripsi dengan aman (`AES-256-GCM`) di server, sehingga aplikasi dapat digunakan secara berkelanjutan tanpa membebani biaya API terpusat pada pemilik server.
3. **Personalized Bulking/Diet Engine & AI Coach**: Kalkulasi otomatis BMI, BMR, TDEE (*Maintenance Calories*), dan target kalori/protein harian berdasarkan target berat badan dan tenggat waktu pengguna, didukung oleh **AI Assistant Chatbot** dan **Scheduled Push Notifications** pengingat makan.

---

## 2. Target User Personas

| Persona | Profil & Tujuan | Pain Points Utama | Solusi NutriSnap |
| :--- | :--- | :--- | :--- |
| **1. "Raka — The Hardgainer Bulker"** (Mahasiswa/Pekerja Muda, 21 thn) | Ingin naik berat badan dari 55 kg ke 65 kg dalam 6 bulan dengan otot bersih (*lean bulk*). | Sering lupa makan siang/malam tepat waktu, tidak tahu apakah kalori harian sudah *surplus* dan protein sudah mencapai target $2\times$ berat badan. | Kalkulator target surplus otomatis, indikator status *Surplus/Defisit* real-time di dashboard, AI Chatbot untuk ide makanan tinggi kalori murah, dan Push Notification saat jam makan terlewat. |
| **2. "Sinta — The Fat-Loss Tracker"** (Karyawan Kantoran, 27 thn) | Ingin turun berat badan dari 72 kg ke 60 kg dalam 8 bulan sambil menjaga asupan protein. | Makanan kantin/warteg tidak punya label kalori; malas mengetik banyak bahan satu per satu. | AI Food Photo Scanner langsung dari kamera HP (PWA di Home Screen) untuk mengestimasi kalori piring makan siang dalam hitungan detik. |
| **3. "Dimas — The Macro Precision Lifter"** (Gym Enthusiast, 25 thn) | Menimbang makanan sendiri di rumah (dada ayam, nasi putih, telur) menggunakan timbangan dapur digital. | Membutuhkan form input manual yang sangat cepat (cukup ketik nama makanan & berat gram) tanpa harus memotret setiap saat. | Dual Logging: Form Manual Input (Nama Makanan + Berat Gram) dengan kalkulasi nutrisi instan. |

---

## 3. Rumus Bisnis & Kalkulasi Nutrisi (Core Domain Logic)

Seluruh rumus ini diimplementasikan secara terpusat di `packages/shared` agar konsisten di seluruh sistem:

### 3.1. Body Mass Index (BMI)
$$\text{BMI} = \frac{\text{Berat Badan (kg)}}{\left(\frac{\text{Tinggi Badan (cm)}}{100}\right)^2}$$
- **Kategori BMI:**
  - $< 18.5$: *Underweight* (Kurus)
  - $18.5 - 24.9$: *Normal / Ideal*
  - $25.0 - 29.9$: *Overweight* (Kelebihan Berat Badan)
  - $\ge 30.0$: *Obese* (Obesitas)

### 3.2. Basal Metabolic Rate (BMR — Mifflin-St Jeor Equation)
- **Pria:**
  $$\text{BMR} = (10 \times \text{Berat kg}) + (6.25 \times \text{Tinggi cm}) - (5 \times \text{Usia tahun}) + 5$$
- **Wanita:**
  $$\text{BMR} = (10 \times \text{Berat kg}) + (6.25 \times \text{Tinggi cm}) - (5 \times \text{Usia tahun}) - 161$$

### 3.3. Maintenance Calories (TDEE — Total Daily Energy Expenditure)
$$\text{Maintenance Calories (TDEE)} = \text{BMR} \times \text{Activity Multiplier}$$
- `sedentary` (Jarang olahraga / kerja meja): $\times 1.2$
- `light` (Olahraga 1–2 hari/minggu): $\times 1.375$
- `moderate` (Olahraga 3–5 hari/minggu): $\times 1.55$
- `active` (Olahraga 6–7 hari/minggu): $\times 1.725$
- `very_active` (Atlet / pekerja fisik berat): $\times 1.9$

### 3.4. Target Kalori Harian, Status Surplus/Defisit & Target Protein
- Konversi energi jaringan tubuh: $1\text{ kg} \approx 7700\text{ kcal}$.
- Selisih berat badan: $\Delta W = \text{Target Weight (kg)} - \text{Current Weight (kg)}$.
- Total hari menuju target: $D = \text{Target Timeline (hari)}$ (dikonversi dari input bulan/tahun pengguna).
- **Delta Kalori Harian Ideal:**
  $$\Delta \text{kcal/hari} = \frac{\Delta W \times 7700}{D}$$
- **Target Kalori Harian:**
  $$\text{Target Daily Calories} = \text{TDEE} + \Delta \text{kcal/hari}$$
- **Safety Guardrail (Batas Kesehatan):**
  - Jika $\Delta \text{kcal/hari} < -1000\text{ kcal}$ (defisit terlalu ekstrem) atau $> +1000\text{ kcal}$ (surplus terlalu ekstrem), sistem memberikan peringatan kesehatan (*health warning badge*) dan menawarkan tombol penyesuaian ke rentang aman ($-500\text{ kcal}$ untuk cutting atau $+300\text{ s/d }+500\text{ kcal}$ untuk lean bulking), serta menjaga batas bawah kalori harian minimal $1200\text{ kcal}$ (wanita) / $1500\text{ kcal}$ (pria).
- **Target Protein Harian:**
  - Mode **Bulking** ($\Delta W > 0$): $1.8\text{ g} - 2.0\text{ g} \times \text{Berat Badan Saat Ini (kg)}$.
  - Mode **Cutting / Deficit** ($\Delta W < 0$): $2.0\text{ g} - 2.2\text{ g} \times \text{Berat Badan Saat Ini (kg)}$ (lebih tinggi untuk mencegah penyusutan otot saat defisit kalori).
  - Mode **Maintenance** ($\Delta W = 0$): $1.6\text{ g} \times \text{Berat Badan Saat Ini (kg)}$.

---

## 4. Fitur Utama, User Stories & Acceptance Criteria

### Epic 1: Authentication & Security (Google OAuth + BYOK)

#### US-01: Google OAuth Login
- **Sebagai** pengguna, **saya ingin** masuk ke NutriSnap menggunakan akun Google saya dengan satu klik, **sehingga** saya tidak perlu membuat dan mengingat password baru.
- **Acceptance Criteria:**
  1. **Given** pengguna belum login dan membuka rute terproteksi (`/dashboard`, `/log`, `/chat`, `/settings`), **When** halaman dimuat, **Then** sistem mengarahkan pengguna ke halaman `/login`.
  2. **Given** pengguna menekan tombol "Continue with Google", **When** autentikasi OAuth berhasil, **Then** sistem membuat sesi aman dan memeriksa status `onboarding_completed`:
     - Jika `false`, arahkan ke `/onboarding`.
     - Jika `true`, arahkan ke `/dashboard`.

#### US-02: BYOK (Bring Your Own Gemini API Key) Management
- **Sebagai** pengguna, **saya ingin** menyimpan Google Gemini API Key milik saya sendiri di menu Settings (atau saat Onboarding), **sehingga** saya dapat menggunakan fitur AI Scanner dan Chatbot dengan aman.
- **Acceptance Criteria:**
  1. **Given** pengguna berada di halaman Settings / Onboarding, **When** pengguna memasukkan Gemini API Key dan menekan "Validasi & Simpan", **Then** `apps/backend` melakukan tes koneksi ringan ke Gemini API menggunakan key tersebut.
  2. **Given** API Key valid, **When** disimpan ke PostgreSQL, **Then** key wajib dienkripsi menggunakan `AES-256-GCM` (`iv:authTag:ciphertext`) dan hanya `keyHint` (contoh: `AIza...7f9Q`) yang dikembalikan ke frontend.
  3. **Given** pengguna belum mengatur API Key atau API Key tidak valid, **When** pengguna mencoba menggunakan AI Photo Scanner atau AI Chatbot, **Then** UI menampilkan banner informatif beserta tombol pintas menuju pengaturan API Key (sementara fitur pencatatan manual tetap dapat digunakan).

---

### Epic 2: Onboarding & Personalization Engine

#### US-03: Initial Questionnaire & Nutrition Calculation
- **Sebagai** pengguna baru, **saya ingin** mengisi data diri (nama, usia, tinggi badan, berat badan saat ini, jenis kelamin, tingkat aktivitas, target berat badan, dan target durasi dalam bulan/tahun), **sehingga** sistem dapat menghitung BMI, kalori pemeliharaan (*maintenance*), serta target kalori dan protein harian saya secara akurat.
- **Acceptance Criteria:**
  1. **Given** pengguna berada di wizard `/onboarding`, **When** pengguna mengisi seluruh field (Nama, Usia, Tinggi cm, Berat kg, Gender, Tingkat Aktivitas, Target Berat kg, dan Target Waktu dalam Bulan/Tahun), **Then** sistem secara instan menampilkan pratinjau hasil kalkulasi:
     - Skor **BMI** beserta kategorinya (*Underweight / Normal / Overweight / Obese*).
     - **Maintenance Calories (TDEE)** dalam kcal/hari.
     - **Status Program Otomatis**: *Bulking (Surplus)* jika Target Berat > Berat Saat Ini, *Cutting (Deficit)* jika Target Berat < Berat Saat Ini, atau *Maintenance* jika sama.
     - **Target Kalori Harian (kcal)** dan **Target Protein Harian (gram)**.
  2. **Given** pengguna menyetujui hasil kalkulasi dan menekan "Mulai Perjalanan NutriSnap", **When** data disimpan, **Then** profil pengguna diperbarui (`onboarding_completed = true`) dan pengguna diarahkan ke `/dashboard`.

---

### Epic 3: Dual Nutrition Logging (AI Photo Scanner & Manual Form)

#### US-04: AI Food Photo Scanner (Gemini Multimodal)
- **Sebagai** pengguna, **saya ingin** memotret atau mengunggah foto makanan saya, **sehingga** AI dapat mengekstrak nama komponen makanan, estimasi gramasi, kalori, dan protein secara otomatis.
- **Acceptance Criteria:**
  1. **Given** pengguna membuka halaman `/log` (tab "AI Photo Scan") dan memilih foto dari kamera/galeri, **When** foto dipilih, **Then** `apps/frontend` mengompresi foto di sisi client (`<= 1280px`, WebP/JPEG) sebelum mengirimkannya ke `apps/backend`.
  2. **Given** `apps/backend` menerima foto dan tipe waktu makan (`breakfast`, `lunch`, `dinner`, `snack`), **When** backend mendekripsi BYOK user dan memanggil Gemini Multimodal dengan `responseSchema`, **Then** Gemini mengembalikan daftar item makanan beserta estimasi berat (gram), kalori (kcal), protein (g), karbohidrat (g), dan lemak (g).
  3. **Given** hasil ekstraksi AI tampil di layar, **When** pengguna meninjau daftar makanan, **Then** pengguna dapat mengedit nama/gramasi/kalori jika diperlukan sebelum menekan tombol "Simpan ke Log Harian".

#### US-05: Manual Input Form (Food Name + Weight in Grams)
- **Sebagai** pengguna, **saya ingin** mencatat makanan secara manual dengan mengetik nama makanan dan beratnya dalam gram, **sehingga** saya tetap bisa mencatat nutrisi dengan cepat meskipun tidak memiliki foto makanan.
- **Acceptance Criteria:**
  1. **Given** pengguna membuka halaman `/log` (tab "Manual Input"), **When** pengguna mengetik nama makanan (contoh: "Dada Ayam Panggang") dan berat dalam gram (contoh: `200` g), **Then** pengguna dapat:
     - Memilih dari saran database makanan lokal populer (otomatis menghitung kalori & protein proporsional terhadap gramasi), ATAU
     - Menekan tombol **"Estimasi Nutrisi dengan AI"** (menghitung makro dari nama + gramasi via Gemini), ATAU
     - Mengisi/mengoreksi nilai kalori (kcal) dan protein (g) secara langsung.
  2. **Given** form valid dan pengguna menekan "Simpan Log", **When** tersimpan di database, **Then** total kalori dan protein harian di Dashboard langsung bertambah secara real-time.

---

### Epic 4: Interactive Dashboard & Surplus/Deficit Status Tracker

#### US-06: Daily Nutrition & Surplus/Deficit Dashboard
- **Sebagai** pengguna, **saya ingin** melihat progres kalori dan protein harian saya dibandingkan target, lengkap dengan indikator status Surplus/Defisit, **sehingga** saya tahu berapa banyak lagi makanan yang harus saya konsumsi hari ini.
- **Acceptance Criteria:**
  1. Menampilkan **Calorie Ring / Progress Card**: Kalori Masuk (*Consumed*) vs Target Kalori Harian, serta selisih terhadap *Maintenance Calories (TDEE)*.
  2. Menampilkan **Surplus / Deficit Status Badge**:
     - Untuk user *Bulking*: Menunjukkan apakah asupan hari ini masih di bawah maintenance (*Under Maintenance*), sedang menuju target surplus (*In Surplus Zone*), atau sudah mencapai target (*Target Surplus Reached*).
     - Untuk user *Cutting*: Menunjukkan apakah asupan hari ini berada dalam zona defisit aman (*On Track Deficit*) atau melewati batas kalori (*Over Target*).
  3. Menampilkan **Protein & Macro Progress Bars** (Protein sebagai metrik utama, diikuti Karbohidrat & Lemak).
  4. Menampilkan daftar **Log Makanan Hari Ini** yang dikelompokkan berdasarkan *Sarapan, Makan Siang, Makan Malam,* dan *Camilan*, lengkap dengan opsi hapus/edit item.

---

### Epic 5: Dedicated AI Bulking & Diet Assistant Chatbot

#### US-07: Contextual Nutrition & Bulking/Diet Chatbot
- **Sebagai** pengguna, **saya ingin** bertanya kepada asisten chatbot AI khusus seputar strategi bulking, diet, rekomendasi menu tinggi protein, atau pengganti bahan makanan, **sehingga** saya mendapatkan panduan nutrisi yang sesuai dengan profil tubuh dan progres harian saya.
- **Acceptance Criteria:**
  1. **Given** pengguna membuka halaman `/chat`, **When** pengguna mengirim pesan pertanyaan (atau memilih *Quick Prompt Chip* seperti *"Saya masih kurang 600 kcal & 45g protein malam ini, sebaiknya makan apa?"*), **Then** `apps/backend` menginjeksikan konteks profil pengguna (BMI, TDEE, Target Bulking/Cutting, dan sisa kalori/protein hari ini) ke sistem prompt Gemini.
  2. **Given** Gemini memproses jawaban, **When** respons dikirim, **Then** jawaban ditampilkan secara *streaming* (atau respons cepat terformat Markdown rapi) dan riwayat percakapan disimpan di database pengguna.

---

### Epic 6: Mobile-First UX, Theme, & PWA Scheduled Push Notifications

#### US-08: Responsive Navigation (<768px Bottom Nav) & Light/Dark Mode
- **Sebagai** pengguna mobile, **saya ingin** bernavigasi menggunakan satu tangan melalui *bottom navigation bar* pada layar `< 768px` serta memilih mode tampilan Terang (*Light*) atau Gelap (*Dark*).
- **Acceptance Criteria:**
  1. Pada viewport `< 768px`, navigasi utama berada di bagian bawah layar (*Fixed Bottom Navbar*) dengan 5 item: **Dashboard**, **Analytics**, **+ Scan/Log** (tombol aksi tengah menonjol), **AI Coach**, dan **Settings**.
  2. Pada viewport `>= 768px`, navigasi beralih menjadi *Left Sidebar* yang rapi dan *Bottom Navbar* disembunyikan.
  3. Pengguna dapat mengubah tema (*Light / Dark / System*) tanpa *page reload* maupun *flash of unstyled content*.

#### US-09: Installable PWA & Scheduled Push Notifications for Unlogged Meals
- **Sebagai** pengguna, **saya ingin** meng-install NutriSnap sebagai aplikasi PWA di iOS/Android dan menerima pengingat notifikasi terjadwal jika saya belum mencatat makan pada jam makan harian, **sehingga** saya konsisten mencapai target kalori/protein.
- **Acceptance Criteria:**
  1. Aplikasi memiliki `manifest.webmanifest` valid, ikon multi-ukuran, dan Service Worker (`sw.js`) yang mendukung event `push` dan `notificationclick`.
  2. Pengguna dapat mengaktifkan/menonaktifkan pengingat makan serta mengatur jam pengingat (*Sarapan, Makan Siang, Makan Malam*) dan zona waktu di halaman Settings.
  3. Scheduler di `apps/backend` memeriksa secara berkala setiap 15 menit; jika waktu lokal pengguna telah melewati jam makan yang ditentukan dan belum ada catatan di `meal_logs` untuk waktu makan tersebut pada hari itu, sistem mengirimkan Web Push Notification yang jika diklik akan membuka halaman `/log`.

---

## 5. Non-Functional Requirements (NFR)

1. **Performance & Latency (Full Coolify Advantage):**
   - Komunikasi internal antara `apps/frontend` dan `apps/backend` di jaringan Docker Coolify harus memiliki *network overhead* `< 5ms`.
   - Waktu respons API untuk operasi database standar (Dashboard load, Manual Meal Log, Profile update) harus `< 100ms` (p95).
   - Waktu analisis AI Food Photo Scanner (setelah gambar terkompresi) ditargetkan selesai dalam `2 - 5 detik` menggunakan `gemini-2.5-flash`.
2. **Security & Privacy:**
   - Enkripsi `AES-256-GCM` wajib untuk semua API Key pengguna.
   - Proteksi CORS ketat hanya mengizinkan origin frontend resmi.
   - Cookie sesi menggunakan atribut `HttpOnly`, `Secure`, dan `SameSite=Lax`.
3. **Reliability & Portability:**
   - Seluruh layanan dikemas dalam Docker (`Dockerfile` masing-masing untuk `apps/frontend` dan `apps/backend` + `docker-compose.coolify.yml`) sehingga dapat di-redeploy di Coolify kapan saja dengan *zero configuration drift*.

