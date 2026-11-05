# Engineering Bug Log, Edge Cases & Architectural Decisions (BUGS.md) — NutriSnap

Dokumen ini mencatat seluruh temuan bug, *edge case*, serta keputusan teknis yang diambil dan diselesaikan selama eksekusi **Sprint 1 hingga Sprint 5** agar tidak ada blocker yang tertunda.

---

## Log Resolusi Bug & Keputusan Teknis per Sprint

| ID | Sprint | Komponen | Deskripsi Masalah / Keputusan | Solusi yang Diterapkan | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `BUG-001` | Sprint 0 | `pnpm-workspace` | `pnpm@12` memblokir postinstall script bawaan `esbuild`, `protobufjs`, dan `@google/genai` secara default (`ERR_PNPM_IGNORED_BUILDS`). | Menambahkan konfigurasi eksplisit `allowBuilds` pada `pnpm-workspace.yaml` sehingga instalasi CI/CD dan Docker berjalan tanpa prompt interaktif. | ✅ Resolved |
| `BUG-002` | Sprint 0 | `apps/backend` | Parameter `error` pada `app.setErrorHandler` di Fastify v5 bertipe `unknown` pada TypeScript Strict Mode (`TS18046`). | Melakukan *type narrowing* aman sebelum membaca `statusCode`, `code`, dan `message`. | ✅ Resolved |
